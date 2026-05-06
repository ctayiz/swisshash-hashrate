'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Users, Package,
  Radio, LogOut, Zap, TrendingUp, ClipboardList
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/admin',            label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { href: '/admin/orders',     label: 'Bestellungen', icon: ShoppingCart },
  { href: '/admin/customers',  label: 'Kunden',       icon: Users },
  { href: '/admin/packages',   label: 'Pakete',       icon: Package },
  { href: '/admin/proxy',      label: 'Proxy-Config', icon: Radio },
  { href: '/admin/analytics',  label: 'Analytics',    icon: TrendingUp },
  { href: '/admin/audit',      label: 'Audit-Log',    icon: ClipboardList },
]

export function AdminSidebar() {
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
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-500 rounded-md flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-white font-bold">SwissHash</span>
            <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">
              Admin
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map(item => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Abmelden
        </button>
      </div>
    </aside>
  )
}
