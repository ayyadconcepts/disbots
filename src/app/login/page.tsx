import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
          <CardDescription>
            Entrez votre email et mot de passe pour accéder au Dashboard Humalore.
          </CardDescription>
        </CardHeader>
        <form action={login}>
          <CardContent className="space-y-4">
            {searchParams?.error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-100/50 dark:bg-red-900/20 rounded-md">
                <AlertCircle className="w-4 h-4" />
                <span>{searchParams.error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="admin@humalore.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
