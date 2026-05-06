import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { CountdownTimer } from '@/components/orders/CountdownTimer'
import Link from 'next/link'
import { Zap, ShoppingCart, Clock, Package } from 'lucide-react'
import type { OrderStatus } from '@/types/domain'

interface OrderRow {
  id: string
  hashrate_th: number
  duration_days: number
  price_usd: number
  status: OrderStatus
  activated_at: string | null
  expires_at: string | null
  created_at: string
  package: { name: string } | null
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('orders')
    .select('id, hashrate_th, duration_days, price_usd, status, activated_at, expires_at, created_at, package:packages(name)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  const orders = (data ?? []) as unknown as OrderRow[]
  const activeOrders  = orders.filter(o => o.status === 'active')
  const pausedOrders  = orders.filter(o => o.status === 'paused')
  const pendingOrders = orders.filter(o => o.status === 'pending')
  const pastOrders    = orders.filter(o => o.status === 'expired' || o.status === 'cancelled')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bestellungen</h1>
          <p className="text-slate-400 mt-1">Übersicht deiner Hashrate-Pakete</p>
        </div>
        <Link
          href="/packages"
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Neue Hashrate
        </Link>
      </div>

      {orders.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Noch keine Bestellungen vorhanden.</p>
            <Link href="/packages" className="inline-block mt-3 text-orange-400 hover:text-orange-300 text-sm">
              Jetzt Paket buchen →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <Section title="Aktiv" count={activeOrders.length} color="text-green-400">
          <div className="grid gap-4">
            {activeOrders.map(order => (
              <ActiveOrderCard key={order.id} order={order} />
            ))}
          </div>
        </Section>
      )}

      {/* Paused orders */}
      {pausedOrders.length > 0 && (
        <Section title="Pausiert" count={pausedOrders.length} color="text-blue-400">
          <div className="grid gap-3">
            {pausedOrders.map(order => (
              <SimpleOrderRow key={order.id} order={order} />
            ))}
          </div>
        </Section>
      )}

      {/* Pending orders */}
      {pendingOrders.length > 0 && (
        <Section title="Ausstehend" count={pendingOrders.length} color="text-yellow-400">
          <div className="grid gap-3">
            {pendingOrders.map(order => (
              <SimpleOrderRow key={order.id} order={order} />
            ))}
          </div>
        </Section>
      )}

      {/* Past orders */}
      {pastOrders.length > 0 && (
        <Section title="Verlauf" count={pastOrders.length} color="text-slate-400">
          <Card className="bg-slate-800/50 border-slate-700">
            <div className="divide-y divide-slate-700/50">
              {pastOrders.map(order => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors"
                >
                  <div>
                    <p className="text-slate-300 text-sm font-medium">
                      {order.package?.name ?? `${order.hashrate_th} TH/s`}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm">{order.hashrate_th} TH/s</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </Section>
      )}
    </div>
  )
}

function Section({ title, count, color, children }: {
  title: string; count: number; color: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className={`text-sm font-bold uppercase tracking-wide ${color}`}>{title}</h2>
        <span className="text-slate-600 text-xs bg-slate-800 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      {children}
    </div>
  )
}

function ActiveOrderCard({ order }: { order: OrderRow }) {
  const progressPct = order.activated_at && order.expires_at
    ? Math.max(0, Math.min(100,
        ((Date.now() - new Date(order.activated_at).getTime()) /
         (new Date(order.expires_at).getTime() - new Date(order.activated_at).getTime())) * 100
      ))
    : 0

  return (
    <Link href={`/orders/${order.id}`}>
      <Card className="bg-slate-800/50 border-green-500/20 hover:border-green-500/40 transition-all cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold group-hover:text-green-300 transition-colors">
                  {order.package?.name ?? `${order.hashrate_th} TH/s`}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">{order.hashrate_th} TH/s · {order.duration_days} Tage</p>
              </div>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          {order.activated_at && order.expires_at ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Verbleibende Zeit
                </span>
                <span>
                  {new Date(order.expires_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <CountdownTimer expiresAt={order.expires_at} activatedAt={order.activated_at} />
            </div>
          ) : (
            <p className="text-slate-500 text-xs">Noch nicht aktiviert</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

function SimpleOrderRow({ order }: { order: OrderRow }) {
  return (
    <Link href={`/orders/${order.id}`}>
      <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-700 rounded-lg">
                <Package className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {order.package?.name ?? `${order.hashrate_th} TH/s`}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {new Date(order.created_at).toLocaleDateString('de-DE')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm">{order.hashrate_th} TH/s</span>
              <OrderStatusBadge status={order.status} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
