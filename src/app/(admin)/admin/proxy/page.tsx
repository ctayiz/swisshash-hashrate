import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { YamlViewer } from '@/components/proxy/YamlViewer'
import { RebuildButton } from './RebuildButton'
import Link from 'next/link'
import { Radio, History, Zap, ShoppingCart } from 'lucide-react'
import type { ProxyConfigVersion } from '@/types/domain'

interface ActiveOrderRow {
  id: string
  hashrate_th: number
  customer: { email: string } | null
  pool_config: { worker_name: string } | null
}

export default async function AdminProxyPage() {
  await requireAdmin()
  const admin = createAdminClient()

  const [{ data: latestData }, { data: activeData }] = await Promise.all([
    admin
      .from('proxy_config_versions')
      .select('*')
      .order('version', { ascending: false })
      .limit(1)
      .single(),
    admin
      .from('orders')
      .select('id, hashrate_th, customer:profiles(email), pool_config:customer_pool_configs(worker_name)')
      .eq('status', 'active'),
  ])

  const latest = latestData as unknown as ProxyConfigVersion | null
  const activeOrders = (activeData ?? []) as unknown as ActiveOrderRow[]
  const totalTH = activeOrders.reduce((sum, o) => sum + o.hashrate_th, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Proxy-Konfiguration</h1>
          <p className="text-slate-400 mt-1">
            Aktuelle YAML-Konfiguration für den Hashcore Stratum Proxy
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/proxy/history" className="text-slate-400 hover:text-white text-sm flex items-center gap-1.5">
            <History className="w-4 h-4" />
            Versionsverlauf
          </Link>
          <RebuildButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <Radio className="w-5 h-5 text-orange-400" />
            <div>
              <p className="text-slate-400 text-xs">Aktuelle Version</p>
              <p className="text-white font-bold">#{latest?.version ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-slate-400 text-xs">Gesamt-Hashrate</p>
              <p className="text-white font-bold">{totalTH} TH/s</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-slate-400 text-xs">Aktive Orders</p>
              <p className="text-white font-bold">{activeOrders.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active order weights */}
      {activeOrders.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Gewichtungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeOrders.map(order => {
                const weight = totalTH > 0 ? order.hashrate_th / totalTH : 0
                return (
                  <div key={order.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-sm">{order.customer?.email ?? '—'}</span>
                        <span className="text-slate-400 text-sm">
                          {order.hashrate_th} TH/s · {(weight * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${weight * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* YAML viewer */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base font-mono">
            config.yaml — v{latest?.version ?? '?'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latest ? (
            <YamlViewer content={latest.yaml_content} />
          ) : (
            <p className="text-slate-400 text-sm">
              Noch keine Konfiguration generiert. Klicke auf &quot;Neu generieren&quot;.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
