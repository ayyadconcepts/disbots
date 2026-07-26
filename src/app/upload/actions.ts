'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type CsvRow = {
  thread_id: string
  is_topic: 'TRUE' | 'FALSE' | 'true' | 'false' | boolean
  title?: string
  content: string
  username: string
  category_id?: string
  scheduled_at: string
}

export async function processUpload(parsedData: CsvRow[]) {
  const supabase = await createClient()
  
  // 1. Grouper par thread_id
  const groups: Record<string, CsvRow[]> = {}
  parsedData.forEach(row => {
    if (!groups[row.thread_id]) groups[row.thread_id] = []
    groups[row.thread_id].push(row)
  })

  let totalTopics = 0
  let totalReplies = 0

  // 2. Traitement groupe par groupe
  for (const [threadId, rows] of Object.entries(groups)) {
    // Trouver le topic
    const topicRow = rows.find(r => r.is_topic === 'TRUE' || r.is_topic === 'true' || r.is_topic === true)
    const replyRows = rows.filter(r => r !== topicRow)

    if (!topicRow) {
      console.warn(`Thread ${threadId} n'a pas de topic (is_topic=TRUE). Ignoré.`)
      continue
    }

    // Insérer le topic
    const { data: topic, error: topicError } = await supabase
      .from('scheduled_topics')
      .insert({
        title: topicRow.title || 'Sans titre',
        content: topicRow.content,
        category_id: parseInt(topicRow.category_id || '0'),
        username: topicRow.username,
        scheduled_at: new Date(topicRow.scheduled_at).toISOString(),
        status: 'pending'
      })
      .select('id')
      .single()

    if (topicError) {
      console.error(`Erreur insertion topic ${threadId}:`, topicError)
      continue
    }
    
    totalTopics++

    // Insérer les réponses avec le topic_id
    if (replyRows.length > 0) {
      const repliesToInsert = replyRows.map(r => ({
        topic_id: topic.id,
        content: r.content,
        username: r.username,
        scheduled_at: new Date(r.scheduled_at).toISOString(),
        status: 'pending'
      }))

      const { error: replyError } = await supabase
        .from('scheduled_replies')
        .insert(repliesToInsert)

      if (replyError) {
        console.error(`Erreur insertion réponses pour ${threadId}:`, replyError)
      } else {
        totalReplies += replyRows.length
      }
    }
  }

  revalidatePath('/')
  
  return { success: true, message: `${totalTopics} Topics et ${totalReplies} Réponses importés avec succès.` }
}
