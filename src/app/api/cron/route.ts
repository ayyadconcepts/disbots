export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// We use the normal supabase client here (service role or anon) since it's a cron.
// But we need to bypass RLS for updating rows, so we use the service role key if available,
// otherwise anon key (but anon key requires RLS policies to allow updates).
// Wait, the user only provided Anon Key. We will use the Anon Key but the RLS policies
// we created allow authenticated users. A cron route isn't authenticated.
// To fix this without Service Role key, we could sign in the cron job with a dummy user, or
// just disable RLS / add a policy for anon if it's an internal tool.
// Actually, since this is a backend route, it's safer to use the service role key.
// But let's assume Anon Key has access because we created:
// CREATE POLICY "Allow authenticated users to update topics" ON scheduled_topics FOR UPDATE TO authenticated USING (true);
// If it fails, we will tell the user. For now, let's use the provided anon key.
// A better way is just checking the CRON_SECRET.

const DISCOURSE_URL = 'https://humalore.com'
const DISCOURSE_API_KEY = process.env.DISCOURSE_API_KEY!
const CRON_SECRET = process.env.CRON_SECRET!

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Use service role key if possible, but fallback to anon. 
  // RLS might block this if not authenticated.
  // Actually, we can just use the supabase client. If RLS blocks, we need a service_role key.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date().toISOString()
  let processedTopics = 0
  let processedReplies = 0

  try {
    // 1. Fetch pending topics
    const { data: topics, error: topicFetchError } = await supabase
      .from('scheduled_topics')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .limit(10)

    if (topicFetchError) throw new Error('Error fetching topics: ' + topicFetchError.message)

    for (const topic of topics || []) {
      try {
        const res = await fetch(`${DISCOURSE_URL}/posts.json`, {
          method: 'POST',
          headers: {
            'Api-Key': DISCOURSE_API_KEY,
            'Api-Username': topic.username,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: topic.title,
            raw: topic.content,
            category: topic.category_id,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.errors?.join(', ') || 'Failed to post topic')
        }

        // Success
        await supabase
          .from('scheduled_topics')
          .update({ status: 'published', discourse_topic_id: data.topic_id })
          .eq('id', topic.id)
        
        processedTopics++
      } catch (error: any) {
        // Failed
        await supabase
          .from('scheduled_topics')
          .update({ status: 'failed', error_message: error.message })
          .eq('id', topic.id)
        
        // Cancel all child replies
        await supabase
          .from('scheduled_replies')
          .update({ status: 'cancelled', error_message: 'Parent topic failed to publish' })
          .eq('topic_id', topic.id)
      }
    }

    // 2. Fetch pending replies
    const { data: replies, error: replyFetchError } = await supabase
      .from('scheduled_replies')
      .select('*, scheduled_topics!inner(discourse_topic_id, status)')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .eq('scheduled_topics.status', 'published') // only replies for published topics
      .limit(20)

    if (replyFetchError) throw new Error('Error fetching replies: ' + replyFetchError.message)

    for (const reply of replies || []) {
      try {
        const discourseTopicId = reply.scheduled_topics.discourse_topic_id
        if (!discourseTopicId) throw new Error('Discourse topic ID missing')

        const res = await fetch(`${DISCOURSE_URL}/posts.json`, {
          method: 'POST',
          headers: {
            'Api-Key': DISCOURSE_API_KEY,
            'Api-Username': reply.username,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic_id: discourseTopicId,
            raw: reply.content,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.errors?.join(', ') || 'Failed to post reply')
        }

        // Success
        await supabase
          .from('scheduled_replies')
          .update({ status: 'published' })
          .eq('id', reply.id)
        
        processedReplies++
      } catch (error: any) {
        // Failed
        await supabase
          .from('scheduled_replies')
          .update({ status: 'failed', error_message: error.message })
          .eq('id', reply.id)
      }
    }

    return NextResponse.json({ success: true, processedTopics, processedReplies })
  } catch (error: any) {
    console.error('Cron Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
