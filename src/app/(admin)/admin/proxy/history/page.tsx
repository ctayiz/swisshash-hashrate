import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ProxyConfigVersion } from '@/types/domain'

const triggerLabels: Record<string, string> = {
  order_activated: 'Order aktiviert',
  order_expired: 'Order abgelaufen',
  order_cancelled: 'Order storniert',
  order_paused: 'Order pausiert',
  order_resumed: 'Order fortgesetzt',
  order_reactivated: 'Order reaktiviert',
  manual: 'Manuell',
  cron: 'Cron',
  empty_fallback: 'Fallback (leer)',
}

export default async function ProxyHistoryPage() {
  await requireAdmin()
  const admin = createAdminClient()
  const { data } = await admin
    .from('proxy_config_versions')
    .select('*')
    .order('version', { ascending: false })
    .limit(50)

  const versions = (data ?? []) as ProxyConfigVersion[]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/proxy" className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Konfigurations-Verlauf</h1>
          <p className="text-slate-400 mt-1">Letzte 50 generierte YAML-Versionen</p>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <div className="divide-y divide-slate-700">
          <div className="grid grid-cols-5 px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">
            <span>Version</span>
            <span>Trigger</span>
            <span>Aktive Orders</span>
            <span>Gesamt TH</span>
            <span>Erstellt</span>
          </div>
          {versions.map(v => (
            <div key={v.id} className="grid grid-cols-5 px-4 py-3 items-center">
              <span className="text-white font-mono font-bold">#{v.version}</span>
              <Badge className="bg-slate-700 text-slate-300 border-slate-600 w-fit">
                {triggerLabels[v.trigger_source] ?? v.trigger_source}
              </Badge>
              <span className="text-slate-300 text-sm">{v.active_order_count}</span>
              <span className="text-slate-300 text-sm">{v.total_hashrate_th} TH/s</span>
              <span className="text-slate-400 text-sm">
                {new Date(v.created_at).toLocaleString('de-DE')}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
