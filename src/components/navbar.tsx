'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, UploadCloud, LogOut, MessageSquare } from 'lucide-react'
import { logout } from '@/app/login/actions'
import { Button } from './ui/button'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

export function Navbar() {
  const pathname = usePathname()

  const links = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Upload CSV', href: '/upload', icon: UploadCloud },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <span>Humalore<span className="text-blue-600">Poster</span></span>
          </Link>
          <div className="hidden md:flex gap-1 ml-4">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                    isActive ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit" className="text-slate-600 hover:text-red-600 dark:text-slate-400">
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </form>
        </div>
      </div>
    </nav>
  )
}
