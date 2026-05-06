import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Users, ShoppingCart, TrendingUp, Radio } from 'lucide-react'
import Link from 'next/link'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { ProxyLiveStats } from '@/components/admin/ProxyLiveStats'
import type { OrderStatus, ProxyConfigVersion } from '@/types/domain'

interface OrderRow {
  id: string
  hashrate_th: number
  price_usd: number
  status: OrderStatus
  created_at: string
  package: { name: string } | null
  customer: { email: string } | null
}

export default async function AdminDashboardPage() {
  await requireAdmin()
  const admin = createAdminClient()

  const [
    { count: totalCustomers },
    { data: ordersData },
    { data: latestConfigData },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    admin.from('orders')
      .select('id, hashrate_th, price_usd, status, created_at, customer:profiles(email), package:packages(name)')
      .order('created_at', { ascending: false })
      .limit(10),
    admin.from('proxy_config_versions').select('*').order('version', { ascending: false }).limit(1).single(),
  ])

  const orders = (ordersData ?? []) as unknown as OrderRow[]
  const latestConfig = latestConfigData as unknown as ProxyConfigVersion | null

  const activeOrders = orders.filter(o => o.status === 'active')
  const pendingOrders = orders.filter(o => o.status === 'pending')
  const totalActiveTH = activeOrders.reduce((sum, o) => sum + o.hashrate_th, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">Plattform-Übersicht</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} color="orange" label="Aktive Hashrate" value={`${totalActiveTH} TH/s`} />
        <StatCard icon={Users} color="blue" label="Kunden" value={totalCustomers ?? 0} />
        <StatCard icon={ShoppingCart} color="green" label="Aktive Orders" value={activeOrders.length} />
        <StatCard icon={TrendingUp} color="yellow" label="Ausstehend" value={pendingOrders.length} />
      </div>

      {/* Live Proxy Stats */}
      <ProxyLiveStats />

      {/* Current YAML version */}
      {latestConfig && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Radio className="w-4 h-4 text-orange-400" />
              Proxy-Konfiguration
            </CardTitle>
            <Link href="/admin/proxy" className="text-orange-400 hover:text-orange-300 text-sm">
              Anzeigen →
            </Link>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Version</p>
              <p className="text-white font-bold">#{latestConfig.version}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Aktive Orders</p>
              <p className="text-white font-bold">{latestConfig.active_order_count}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Gesamt-TH</p>
              <p className="text-white font-bold">{latestConfig.total_hashrate_th} TH/s</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Letzte Bestellungen</h2>
          <Link href="/admin/orders" className="text-orange-400 hover:text-orange-300 text-sm">
            Alle anzeigen →
          </Link>
        </div>
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="divide-y divide-slate-700">
            <div className="grid grid-cols-5 px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">
              <span className="col-span-2">Paket</span>
              <span>Kunde</span>
              <span>Hashrate</span>
              <span>Status</span>
            </div>
            {orders.map(order => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="grid grid-cols-5 px-4 py-3 hover:bg-slate-700/30 transition-colors items-center"
              >
                <div className="col-span-2">
                  <p className="text-white text-sm">{order.package?.name ?? `${order.hashrate_th} TH`}</p>
                  <p className="text-slate-500 text-xs">
                    {new Date(order.created_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <span className="text-slate-400 text-sm truncate">{order.customer?.email ?? '—'}</span>
                <span className="text-slate-300 text-sm">{order.hashrate_th} TH/s</span>
                <OrderStatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon, color, label, value,
}: {
  icon: React.ElementType
  color: string
  label: string
  value: string | number
}) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-${color}-500/20 rounded-lg`}>
            <Icon className={`w-5 h-5 text-${color}-400`} />
          </div>
          <div>
            <p className="text-slate-400 text-xs">{label}</p>
            <p className="text-white text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
