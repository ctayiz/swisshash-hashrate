import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { Zap, Clock, Server, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import type { OrderStatus } from '@/types/domain'

interface OrderDetail {
  id: string
  hashrate_th: number
  duration_days: number
  price_usd: number
  status: OrderStatus
  activated_at: string | null
  expires_at: string | null
  package: { name: string } | null
  pool_config: { pool_url: string; pool_port: number; worker_name: string } | null
}

interface EventRow {
  id: string
  event_type: string
  created_at: string
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('orders')
    .select('id, hashrate_th, duration_days, price_usd, status, activated_at, expires_at, package:packages(name), pool_config:customer_pool_configs(pool_url, pool_port, worker_name)')
    .eq('id', orderId)
    .eq('customer_id', user.id)
    .single()

  if (!data) notFound()
  const order = data as unknown as OrderDetail

  const { data: eventsData } = await supabase
    .from('order_events')
    .select('id, event_type, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  const events = (eventsData ?? []) as unknown as EventRow[]

  const eventIcons: Record<string, React.ReactNode> = {
    created: <AlertCircle className="w-4 h-4 text-slate-400" />,
    activated: <CheckCircle2 className="w-4 h-4 text-green-400" />,
    expired: <Clock className="w-4 h-4 text-slate-400" />,
    cancelled: <XCircle className="w-4 h-4 text-red-400" />,
    payment_received: <CheckCircle2 className="w-4 h-4 text-blue-400" />,
    noted: <AlertCircle className="w-4 h-4 text-yellow-400" />,
  }

  const eventLabels: Record<string, string> = {
    created: 'Bestellung erstellt',
    activated: 'Bestellung aktiviert',
    expired: 'Paket abgelaufen',
    cancelled: 'Bestellung storniert',
    payment_received: 'Zahlung erhalten',
    noted: 'Notiz hinzugefügt',
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bestellung</h1>
          <p className="text-slate-400 text-sm mt-1 font-mono">{order.id}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base">Paket-Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Paket</p>
            <p className="text-white font-medium">
              {order.package?.name ?? `${order.hashrate_th} TH`}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Hashrate</p>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-white font-medium">{order.hashrate_th} TH/s</span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Laufzeit</p>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium">
                {order.duration_days} {order.duration_days === 1 ? 'Tag' : 'Tage'}
              </span>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Preis</p>
            <p className="text-white font-medium">${order.price_usd}</p>
          </div>
          {order.activated_at && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Aktiviert</p>
              <p className="text-white text-sm">
                {new Date(order.activated_at).toLocaleString('de-DE')}
              </p>
            </div>
          )}
          {order.expires_at && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Läuft ab</p>
              <p className="text-white text-sm">
                {new Date(order.expires_at).toLocaleString('de-DE')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {order.pool_config && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-400" />
              Pool-Konfiguration
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Pool-URL</p>
              <p className="text-white font-mono text-sm">
                {order.pool_config.pool_url}:{order.pool_config.pool_port}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Worker</p>
              <p className="text-white font-mono text-sm">{order.pool_config.worker_name}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base">Aktivitäten</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-slate-400 text-sm">Keine Aktivitäten.</p>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {eventIcons[event.event_type] ?? eventIcons.noted}
                  </div>
                  <div>
                    <p className="text-white text-sm">
                      {eventLabels[event.event_type] ?? event.event_type}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {new Date(event.created_at).toLocaleString('de-DE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
