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
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!file) return

    setIsUploading(true)
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await processUpload(results.data)
          if (res.success) {
            toast.success("Import réussi", { description: res.message })
            router.push('/')
          }
        } catch (error) {
          toast.error("Erreur lors de l'import", { description: "Une erreur est survenue côté serveur." })
          console.error(error)
        } finally {
          setIsUploading(false)
        }
      },
      error: (error) => {
        toast.error("Erreur de lecture CSV", { description: error.message })
        setIsUploading(false)
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
            Le fichier CSV doit contenir les colonnes : thread_id, is_topic, title, content, username, category_id, scheduled_at.
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
