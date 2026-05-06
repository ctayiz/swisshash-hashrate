import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { OrderActions } from './OrderActions'
import type { OrderStatus } from '@/types/domain'

interface OrderDetail {
  id: string
  hashrate_th: number
  duration_days: number
  price_usd: number
  status: OrderStatus
  activated_at: string | null
  expires_at: string | null
  created_at: string
  package: { name: string } | null
  customer: { email: string; full_name: string | null } | null
  pool_config: { pool_url: string; pool_port: number; worker_name: string } | null
}

interface EventRow {
  id: string
  event_type: string
  created_at: string
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  await requireAdmin()
  const admin = createAdminClient()

  const { data } = await admin
    .from('orders')
    .select('id, hashrate_th, duration_days, price_usd, status, activated_at, expires_at, created_at, customer:profiles!orders_customer_id_fkey(email, full_name), package:packages!orders_package_id_fkey(name), pool_config:customer_pool_configs!orders_pool_config_id_fkey(pool_url, pool_port, worker_name)')
    .eq('id', orderId)
    .single()

  if (!data) notFound()
  const order = data as unknown as OrderDetail

  const { data: eventsData } = await admin
    .from('order_events')
    .select('id, event_type, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  const events = (eventsData ?? []) as EventRow[]

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bestellung</h1>
          <p className="text-slate-400 text-sm font-mono mt-1">{order.id}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Paket</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Name" value={order.package?.name ?? `${order.hashrate_th} TH`} />
            <Row label="Hashrate" value={`${order.hashrate_th} TH/s`} />
            <Row label="Laufzeit" value={`${order.duration_days} Tage`} />
            <Row label="Preis" value={`$${order.price_usd}`} />
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader><CardTitle className="text-white text-sm">Kunde</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="E-Mail" value={order.customer?.email ?? '—'} />
            <Row label="Name" value={order.customer?.full_name ?? '—'} />
            <Row label="Erstellt" value={new Date(order.created_at).toLocaleString('de-DE')} />
            {order.activated_at && (
              <Row label="Aktiviert" value={new Date(order.activated_at).toLocaleString('de-DE')} />
            )}
            {order.expires_at && (
              <Row label="Läuft ab" value={new Date(order.expires_at).toLocaleString('de-DE')} />
            )}
          </CardContent>
        </Card>
      </div>

      <OrderActions orderId={order.id} status={order.status} />

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader><CardTitle className="text-white text-sm">Aktivitäten</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events.map(e => (
              <div key={e.id} className="flex items-center justify-between text-sm border-b border-slate-700 pb-2">
                <span className="text-slate-300 font-medium">{e.event_type}</span>
                <span className="text-slate-500 text-xs">
                  {new Date(e.created_at).toLocaleString('de-DE')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}
