'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Zap, LifeBuoy, UserCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const APP_VERSION = '0.1.0'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/packages', label: 'Hashrate kaufen', icon: Package },
  { href: '/orders', label: 'Bestellungen', icon: ShoppingCart },
  { href: '/pool-config', label: 'Pool-Konfiguration', icon: Settings },
]

export function CustomerSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-slate-900 border-r border-slate-800 flex flex-col z-40">
      <div className="p-5 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-500 rounded-md flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold">SwissHash</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-orange-500/20 text-orange-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 pb-4 space-y-1">
        <div className="flex items-center gap-3 px-3 py-1.5">
          <span className="text-slate-600 text-xs">v{APP_VERSION}</span>
        </div>

        <div className="border-t border-slate-800 pt-2 space-y-1">
          <Link
            href="/profile"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === '/profile'
                ? 'bg-orange-500/20 text-orange-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            <UserCircle className="w-4 h-4" />
            Profil
          </Link>
          <Link
            href="/support"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === '/support'
                ? 'bg-orange-500/20 text-orange-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            <LifeBuoy className="w-4 h-4" />
            Support
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </div>
    </aside>
  )
}
