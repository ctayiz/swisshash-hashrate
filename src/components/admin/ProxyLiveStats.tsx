'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Wifi, CheckCircle, Clock, ArrowDown, ArrowUp, Layers, AlertTriangle, Timer, Hash } from 'lucide-react'
import { formatHashrate, formatUptime, type ProxyMetrics } from '@/lib/proxy/metrics'

export function ProxyLiveStats() {
  const [metrics, setMetrics] = useState<ProxyMetrics | null>(null)
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/proxy/metrics')
      if (!res.ok) { setError(true); return }
      setMetrics(await res.json())
      setLastUpdated(new Date())
      setError(false)
    } catch {
      setError(true)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  if (error) return (
    <Card className="bg-slate-800/50 border-red-500/30">
      <CardContent className="p-5 flex items-center gap-3 text-slate-500 text-sm">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        Proxy-Metriken nicht verfügbar
      </CardContent>
    </Card>
  )

  if (!metrics) return (
    <Card className="bg-slate-800/50 border-slate-700 animate-pulse">
      <CardContent className="p-5 h-40" />
    </Card>
  )

  const dsTotal = metrics.downstream.accepted + metrics.downstream.rejected + metrics.downstream.stale
  const usTotal = metrics.upstream.accepted + metrics.upstream.rejected + metrics.upstream.stale
  const dsAcceptRate = dsTotal > 0 ? ((metrics.downstream.accepted / dsTotal) * 100).toFixed(1) : '100.0'
  const usAcceptRate = usTotal > 0 ? ((metrics.upstream.accepted / usTotal) * 100).toFixed(1) : '100.0'

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live Proxy-Statistiken
            {metrics.version && (
              <span className="text-slate-500 text-xs font-normal ml-1">{metrics.version}</span>
            )}
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Clock className="w-3.5 h-3.5" />
              Uptime: {formatUptime(metrics.uptime_secs)}
            </div>
            {lastUpdated && (
              <span className="text-slate-600 text-xs">
                {lastUpdated.toLocaleTimeString('de-DE')}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Hashrate */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-orange-400" />
              Downstream (Miner → Proxy)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Hashrate (1 min)</p>
              <p className="text-white text-2xl font-bold">{formatHashrate(metrics.downstream.hr_1min)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <StatLine icon={Wifi} color="text-blue-400" label="Miner verbunden" value={metrics.downstream.conn_count} />
              <StatLine icon={Hash} color="text-slate-400" label="Ø Difficulty" value={metrics.downstream.avg_diff.toLocaleString('de-DE')} />
              <StatLine icon={CheckCircle} color="text-green-400" label="Akzeptiert" value={metrics.downstream.accepted.toLocaleString('de-DE')} />
              <StatLine icon={Activity} color="text-green-400" label="Akzeptanzrate" value={`${dsAcceptRate}%`} />
              <StatLine icon={AlertTriangle} color="text-red-400" label="Abgelehnt" value={metrics.downstream.rejected} />
              <StatLine icon={Timer} color="text-yellow-400" label="Stale" value={metrics.downstream.stale} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-blue-400" />
              Upstream (Proxy → Pool)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Hashrate (1 min)</p>
              <p className="text-white text-2xl font-bold">{formatHashrate(metrics.upstream.hr_1min)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <StatLine icon={Wifi} color="text-blue-400" label="Pool-Verbindungen" value={metrics.upstream.conn_count} />
              <StatLine icon={Layers} color="text-purple-400" label="Aggregation" value={`${metrics.aggregation_ratio.toFixed(2)}x`} />
              <StatLine icon={CheckCircle} color="text-green-400" label="Akzeptiert" value={metrics.upstream.accepted.toLocaleString('de-DE')} />
              <StatLine icon={Activity} color="text-green-400" label="Akzeptanzrate" value={`${usAcceptRate}%`} />
              <StatLine icon={AlertTriangle} color="text-red-400" label="Abgelehnt" value={metrics.upstream.rejected} />
              <StatLine icon={Timer} color="text-yellow-400" label="Stale" value={metrics.upstream.stale} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Pool */}
      {metrics.active_pool && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              Aktiver Pool
            </span>
            <span className="text-white font-mono">{metrics.active_pool}</span>
          </CardContent>
        </Card>
      )}

    </div>
  )
}

function StatLine({ icon: Icon, color, label, value }: {
  icon: React.ElementType
  color: string
  label: string
  value: string | number
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className={`w-3 h-3 ${color}`} />
        <span className="text-slate-500 text-xs">{label}</span>
      </div>
      <span className="text-white font-semibold">{value}</span>
    </div>
  )
}
