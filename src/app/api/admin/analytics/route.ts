import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  await requireAdmin()
  const admin = createAdminClient()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString()

  const [{ data: orders }, { data: customers }] = await Promise.all([
    admin
      .from('orders')
      .select('id, price_usd, hashrate_th, duration_days, status, created_at, package:packages(name)')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true }),
    admin
      .from('profiles')
      .select('id, created_at')
      .eq('role', 'customer')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true }),
  ])

  // Daily revenue (last 30 days)
  const dailyRevenue: Record<string, number> = {}
  const dailyOrders: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000)
    const key = d.toISOString().slice(0, 10)
    dailyRevenue[key] = 0
    dailyOrders[key] = 0
  }
  for (const o of orders ?? []) {
    const key = o.created_at.slice(0, 10)
    if (key in dailyRevenue) {
      dailyRevenue[key] += Number(o.price_usd)
      dailyOrders[key] += 1
    }
  }

  // Daily new customers
  const dailyCustomers: Record<string, number> = {}
  for (const key of Object.keys(dailyRevenue)) dailyCustomers[key] = 0
  for (const c of customers ?? []) {
    const key = c.created_at.slice(0, 10)
    if (key in dailyCustomers) dailyCustomers[key] += 1
  }

  const timeline = Object.keys(dailyRevenue).map(date => ({
    date,
    revenue: Math.round(dailyRevenue[date] * 100) / 100,
    orders: dailyOrders[date],
    customers: dailyCustomers[date],
  }))

  // Package popularity
  const pkgCount: Record<string, { name: string; count: number; revenue: number }> = {}
  for (const o of orders ?? []) {
    const key = o.package?.name ?? `${o.hashrate_th} TH`
    if (!pkgCount[key]) pkgCount[key] = { name: key, count: 0, revenue: 0 }
    pkgCount[key].count += 1
    pkgCount[key].revenue += Number(o.price_usd)
  }
  const packageStats = Object.values(pkgCount).sort((a, b) => b.count - a.count)

  // Totals
  const totalRevenue = (orders ?? []).reduce((s, o) => s + Number(o.price_usd), 0)
  const totalOrders = orders?.length ?? 0
  const totalCustomers = customers?.length ?? 0

  return NextResponse.json({ timeline, packageStats, totalRevenue, totalOrders, totalCustomers })
}
