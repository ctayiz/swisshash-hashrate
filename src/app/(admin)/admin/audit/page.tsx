import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { Card } from '@/components/ui/card'
import { CheckCircle2, XCircle, AlertCircle, Clock, Pause, Play, RotateCcw, CreditCard, StickyNote } from 'lucide-react'
import Link from 'next/link'

interface EventRow {
  id: string
  event_type: string
  created_at: string
  metadata: Record<string, unknown> | null
  order: { id: string; hashrate_th: number } | null
  actor: { email: string } | null
}

const EVENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  created:          { label: 'Bestellung erstellt',   icon: AlertCircle,  color: 'text-slate-400' },
  activated:        { label: 'Aktiviert',              icon: CheckCircle2, color: 'text-green-400' },
  expired:          { label: 'Abgelaufen',             icon: Clock,        color: 'text-slate-400' },
  cancelled:        { label: 'Storniert',              icon: XCircle,      color: 'text-red-400' },
  paused:           { label: 'Pausiert',               icon: Pause,        color: 'text-blue-400' },
  resumed:          { label: 'Fortgesetzt',            icon: Play,         color: 'text-blue-400' },
  reactivated:      { label: 'Reaktiviert',            icon: RotateCcw,    color: 'text-purple-400' },
  payment_received: { label: 'Zahlung erhalten',       icon: CreditCard,   color: 'text-green-400' },
  noted:            { label: 'Notiz',                  icon: StickyNote,   color: 'text-yellow-400' },
}

export default async function AuditLogPage() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data } = await admin
    .from('order_events')
    .select('id, event_type, created_at, metadata, order:orders(id, hashrate_th), actor:profiles(email)')
    .order('created_at', { ascending: false })
    .limit(200)

  const events = (data ?? []) as unknown as EventRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit-Log</h1>
        <p className="text-slate-400 mt-1">Alle Order-Ereignisse — letzte 200 Einträge</p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <div className="divide-y divide-slate-700/50">
          {events.length === 0 && (
            <p className="text-slate-400 text-sm p-6">Keine Einträge.</p>
          )}
          {events.map(ev => {
            const cfg = EVENT_CONFIG[ev.event_type] ?? EVENT_CONFIG.noted
            const Icon = cfg.icon
            const order = ev.order as { id: string; hashrate_th: number } | null
            const actor = ev.actor as { email: string } | null
            return (
              <div key={ev.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-700/20 transition-colors">
                <div className={`mt-0.5 shrink-0 ${cfg.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium">{cfg.label}</span>
                    {order && (
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-orange-400 hover:text-orange-300 text-xs font-mono truncate"
                      >
                        Order #{order.id.slice(0, 8)} · {order.hashrate_th} TH/s
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                    <span>{new Date(ev.created_at).toLocaleString('de-DE')}</span>
                    {actor && <span>· {actor.email}</span>}
                    {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                      <span className="text-slate-600 truncate">
                        · {JSON.stringify(ev.metadata).slice(0, 60)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
