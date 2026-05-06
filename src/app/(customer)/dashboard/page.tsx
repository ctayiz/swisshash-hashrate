import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { DashboardActiveOrders } from './DashboardActiveOrders'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { Zap, Clock, CheckCircle2, Package } from 'lucide-react'
import Link from 'next/link'
import type { OrderStatus } from '@/types/domain'

interface OrderRow {
  id: string
  hashrate_th: number
  price_usd: number
  status: OrderStatus
  activated_at: string | null
  expires_at: string | null
  created_at: string
  package: { name: string } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('orders')
    .select('id, hashrate_th, price_usd, status, activated_at, expires_at, created_at, package:packages(name)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const orders = (data ?? []) as unknown as OrderRow[]
  const activeOrders = orders.filter(o => o.status === 'active')
  const totalActiveTH = activeOrders.reduce((sum, o) => sum + o.hashrate_th, 0)
  const pendingOrders = orders.filter(o => o.status === 'pending')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Übersicht deiner aktiven Hashrate-Pakete</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Aktive Hashrate</p>
                <p className="text-white text-xl font-bold">{totalActiveTH} TH/s</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Aktive Pakete</p>
                <p className="text-white text-xl font-bold">{activeOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Ausstehend</p>
                <p className="text-white text-xl font-bold">{pendingOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Packages */}
      <DashboardActiveOrders orders={activeOrders} />

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Letzte Bestellungen</h2>
          <Link href="/orders" className="text-orange-400 hover:text-orange-300 text-sm">
            Alle anzeigen →
          </Link>
        </div>

        {orders.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Noch keine Bestellungen.</p>
              <Link href="/packages" className="inline-block mt-3 text-orange-400 hover:text-orange-300 text-sm">
                Jetzt Paket buchen →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700">
            <div className="divide-y divide-slate-700">
              {orders.slice(0, 5).map(order => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {order.package?.name ?? `${order.hashrate_th} TH`}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-300 text-sm">${order.price_usd}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
