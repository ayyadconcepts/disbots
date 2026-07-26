import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch topics
  const { data: topics } = await supabase
    .from('scheduled_topics')
    .select('*')
    .order('scheduled_at', { ascending: false })

  // Fetch replies
  const { data: replies } = await supabase
    .from('scheduled_replies')
    .select('*, scheduled_topics(title)')
    .order('scheduled_at', { ascending: false })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-green-500">Publié</Badge>
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">En attente</Badge>
      case 'failed': return <Badge variant="destructive">Échoué</Badge>
      case 'cancelled': return <Badge variant="outline" className="text-slate-500">Annulé</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">Supervisez vos publications automatisées sur Discourse.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topics?.filter(t => t.status === 'pending').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics publiés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topics?.filter(t => t.status === 'published').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réponses en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{replies?.filter(r => r.status === 'pending').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réponses publiées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{replies?.filter(r => r.status === 'published').length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="topics" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="topics">Topics ({topics?.length || 0})</TabsTrigger>
          <TabsTrigger value="replies">Réponses ({replies?.length || 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="topics">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Date prévue</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topics?.map((topic) => (
                  <TableRow key={topic.id}>
                    <TableCell className="font-medium max-w-[300px] truncate" title={topic.title}>{topic.title}</TableCell>
                    <TableCell>{topic.username}</TableCell>
                    <TableCell>{format(new Date(topic.scheduled_at), 'dd MMM yyyy HH:mm', { locale: fr })}</TableCell>
                    <TableCell>{topic.category_id}</TableCell>
                    <TableCell>
                      {getStatusBadge(topic.status)}
                      {topic.error_message && <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={topic.error_message}>{topic.error_message}</p>}
                    </TableCell>
                  </TableRow>
                ))}
                {!topics?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun topic planifié.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="replies">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic (Parent)</TableHead>
                  <TableHead>Contenu (Aperçu)</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Date prévue</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replies?.map((reply) => (
                  <TableRow key={reply.id}>
                    <TableCell className="max-w-[200px] truncate" title={reply.scheduled_topics?.title}>
                      {reply.scheduled_topics?.title || 'Topic Inconnu'}
                    </TableCell>
                    <TableCell className="font-medium max-w-[250px] truncate" title={reply.content}>{reply.content}</TableCell>
                    <TableCell>{reply.username}</TableCell>
                    <TableCell>{format(new Date(reply.scheduled_at), 'dd MMM yyyy HH:mm', { locale: fr })}</TableCell>
                    <TableCell>
                      {getStatusBadge(reply.status)}
                      {reply.error_message && <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={reply.error_message}>{reply.error_message}</p>}
                    </TableCell>
                  </TableRow>
                ))}
                {!replies?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune réponse planifiée.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
