import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Download } from 'lucide-react'
import type { Profile } from '@/types/domain'

export default async function AdminCustomersPage() {
  await requireAdmin()
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false })

  const customers = (data ?? []) as Profile[]

  const { data: activeData } = await admin
    .from('orders')
    .select('customer_id')
    .eq('status', 'active')

  const activeCountMap = new Map<string, number>()
  ;(activeData ?? []).forEach((o: { customer_id: string }) => {
    activeCountMap.set(o.customer_id, (activeCountMap.get(o.customer_id) ?? 0) + 1)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kunden</h1>
          <p className="text-slate-400 mt-1">{customers.length} registrierte Nutzer</p>
        </div>
        <Link
          href="/api/admin/export/customers"
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          CSV Export
        </Link>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <div className="divide-y divide-slate-700">
          <div className="grid grid-cols-4 px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">
            <span className="col-span-2">E-Mail</span>
            <span>Rolle</span>
            <span>Aktive Pakete</span>
          </div>
          {customers.map(c => (
            <Link
              key={c.id}
              href={`/admin/customers/${c.id}`}
              className="grid grid-cols-4 px-4 py-3 hover:bg-slate-700/30 transition-colors items-center"
            >
              <div className="col-span-2">
                <p className="text-white text-sm">{c.email}</p>
                <p className="text-slate-500 text-xs">{c.full_name ?? '—'}</p>
              </div>
              <Badge
                className={
                  c.role === 'admin'
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    : 'bg-slate-700 text-slate-400 border-slate-600'
                }
              >
                {c.role}
              </Badge>
              <span className="text-slate-300 text-sm">
                {activeCountMap.get(c.id) ?? 0}
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
