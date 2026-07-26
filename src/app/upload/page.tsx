'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { processUpload, type CsvRow } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!file) return

    setIsUploading(true)
    setProgress('Lecture du fichier...')
    
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Grouper par thread_id
          const groups: Record<string, CsvRow[]> = {}
          results.data.forEach(row => {
            if (row.thread_id) {
              if (!groups[row.thread_id]) groups[row.thread_id] = []
              groups[row.thread_id].push(row)
            }
          })
          
          const allThreads = Object.values(groups)
          const chunkSize = 20 // 20 topics maximum par requête serveur pour éviter les Timeouts sur Vercel
          const totalChunks = Math.ceil(allThreads.length / chunkSize)
          
          for (let i = 0; i < allThreads.length; i += chunkSize) {
            const currentChunk = Math.floor(i / chunkSize) + 1
            setProgress(`Importation... (Lot ${currentChunk} sur ${totalChunks})`)
            
            const chunk = allThreads.slice(i, i + chunkSize).flat()
            const res = await processUpload(chunk)
            
            if (!res.success) {
              throw new Error("Erreur serveur lors de l'import d'un lot.")
            }
          }
          
          toast.success("Import complètement réussi !")
          router.push('/')
        } catch (error: any) {
          toast.error("Erreur d'import", { description: error.message })
          console.error(error)
        } finally {
          setIsUploading(false)
          setProgress('')
        }
      },
      error: (error) => {
        toast.error("Erreur de lecture CSV", { description: error.message })
        setIsUploading(false)
        setProgress('')
      }
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Importer un CSV</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Glisser-déposer ou sélectionner un fichier</CardTitle>
          <CardDescription>
            Le fichier CSV sera traité par petits lots (batchs) automatiquement pour éviter de bloquer le serveur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-12 text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
            <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <div className="mt-4 flex text-sm leading-6 text-slate-600 dark:text-slate-400 justify-center">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md bg-white dark:bg-slate-950 font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
              >
                <span>Télécharger un fichier</span>
                <input id="file-upload" name="file-upload" type="file" accept=".csv" className="sr-only" onChange={handleFileChange} />
              </label>
              <p className="pl-1">ou glisser-déposer</p>
            </div>
            <p className="text-xs leading-5 text-slate-500 mt-2">CSV jusqu'à 10MB</p>
          </div>
          
          {file && (
            <div className="mt-6 flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">{file.name}</span>
              </div>
              <span className="text-sm">{(file.size / 1024).toFixed(2)} KB</span>
            </div>
          )}

          {progress && (
            <div className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 text-center flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {progress}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setFile(null)} disabled={!file || isUploading}>
            Annuler
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Importer les données
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
