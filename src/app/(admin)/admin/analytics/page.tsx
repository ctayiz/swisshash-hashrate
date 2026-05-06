import { requireAdmin } from '@/lib/auth/requireAdmin'
import { AnalyticsCharts } from './AnalyticsCharts'

export default async function AnalyticsPage() {
  await requireAdmin()
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 mt-1">Umsatz, Bestellungen und Kundenentwicklung der letzten 30 Tage</p>
      </div>
      <AnalyticsCharts />
    </div>
  )
}
