'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, ShoppingCart, Users, DollarSign } from 'lucide-react'

interface TimelineEntry {
  date: string
  revenue: number
  orders: number
  customers: number
}
interface PackageStat {
  name: string
  count: number
  revenue: number
}
interface Analytics {
  timeline: TimelineEntry[]
  packageStats: PackageStat[]
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
}

const TICK_STYLE = { fill: '#94a3b8', fontSize: 11 }
const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  color: '#f1f5f9',
  fontSize: 12,
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export function AnalyticsCharts() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl h-48 animate-pulse" />
        ))}
      </div>
    )
  }
  if (!data) return <p className="text-slate-400">Daten konnten nicht geladen werden.</p>

  const { timeline, packageStats, totalRevenue, totalOrders, totalCustomers } = data

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, color: 'green',  label: 'Umsatz (30 Tage)', value: `$${totalRevenue.toFixed(2)}` },
          { icon: ShoppingCart, color: 'blue', label: 'Bestellungen',     value: totalOrders },
          { icon: Users, color: 'purple',      label: 'Neue Kunden',      value: totalCustomers },
          { icon: TrendingUp, color: 'orange', label: 'Ø pro Bestellung', value: totalOrders > 0 ? `$${(totalRevenue / totalOrders).toFixed(2)}` : '—' },
        ].map(({ icon: Icon, color, label, value }) => (
          <Card key={label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-5 flex items-center gap-3">
              <div className={`p-2 bg-${color}-500/20 rounded-lg`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
              </div>
              <div>
                <p className="text-slate-400 text-xs">{label}</p>
                <p className="text-white text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue area chart */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base">Täglicher Umsatz — letzte 30 Tage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tickFormatter={fmt} tick={TICK_STYLE} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={fmt}
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'Umsatz']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders + Customers bar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Bestellungen pro Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tickFormatter={fmt} tick={TICK_STYLE} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={fmt} formatter={(v: number) => [v, 'Bestellungen']} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Neue Kunden pro Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tickFormatter={fmt} tick={TICK_STYLE} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={fmt} formatter={(v: number) => [v, 'Neue Kunden']} />
                <Bar dataKey="customers" fill="#a855f7" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Package popularity */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base">Paket-Beliebtheit (30 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          {packageStats.length === 0 ? (
            <p className="text-slate-500 text-sm">Keine Daten.</p>
          ) : (
            <div className="space-y-3">
              {packageStats.map(pkg => {
                const maxCount = packageStats[0].count
                const pct = Math.round((pkg.count / maxCount) * 100)
                return (
                  <div key={pkg.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-300">{pkg.name}</span>
                      <span className="text-slate-400">{pkg.count}× · ${pkg.revenue.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
