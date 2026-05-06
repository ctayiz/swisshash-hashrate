import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { Card } from '@/components/ui/card'
import { PackageToggle } from './PackageToggle'
import type { Package } from '@/types/domain'

export default async function AdminPackagesPage() {
  await requireAdmin()
  const admin = createAdminClient()
  const { data } = await admin
    .from('packages')
    .select('*')
    .order('hashrate_th', { ascending: true })
    .order('duration_days', { ascending: true })

  const packages = (data ?? []) as Package[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Paketverwaltung</h1>
        <p className="text-slate-400 mt-1">Pakete aktivieren / deaktivieren</p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <div className="divide-y divide-slate-700">
          <div className="grid grid-cols-5 px-4 py-3 text-xs text-slate-500 uppercase tracking-wide">
            <span>Name</span>
            <span>Hashrate</span>
            <span>Laufzeit</span>
            <span>Preis</span>
            <span>Status</span>
          </div>
          {packages.map(pkg => (
            <div key={pkg.id} className="grid grid-cols-5 px-4 py-3 items-center">
              <span className="text-white text-sm font-medium">{pkg.name}</span>
              <span className="text-slate-300 text-sm">{pkg.hashrate_th} TH/s</span>
              <span className="text-slate-300 text-sm">
                {pkg.duration_days} {pkg.duration_days === 1 ? 'Tag' : 'Tage'}
              </span>
              <span className="text-slate-300 text-sm">${pkg.price_usd}</span>
              <PackageToggle id={pkg.id} isActive={pkg.is_active} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
