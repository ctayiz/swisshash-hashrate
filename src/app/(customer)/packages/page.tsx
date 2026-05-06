import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PackageGrid } from '@/components/packages/PackageGrid'
import { ProfitabilityBanner } from '@/components/packages/ProfitabilityBanner'
import { CustomQuoteForm } from '@/components/packages/CustomQuoteForm'
import type { Package } from '@/types/domain'

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ pool_config_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { pool_config_id: preselectedPoolId } = await searchParams

  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('hashrate_th', { ascending: true })
    .order('duration_days', { ascending: true })

  const { data: poolConfigs } = await supabase
    .from('customer_pool_configs')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  // Preselect: query param > default pool > first pool
  const defaultPoolId =
    preselectedPoolId ??
    poolConfigs?.find(p => p.is_default)?.id ??
    poolConfigs?.[0]?.id ??
    null

  const pkgList = (packages as Package[]) ?? []
  const hashrates = [...new Set(pkgList.map(p => p.hashrate_th))].sort((a, b) => a - b)
  const durations = [...new Set(pkgList.map(p => p.duration_days))].sort((a, b) => a - b)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Pakete buchen</h1>
        <p className="text-slate-400 mt-1">
          Wähle dein Hashrate-Paket und starte sofort mit dem Mining
        </p>
      </div>

      <ProfitabilityBanner hashrates={hashrates} durations={durations} />

      <PackageGrid
        packages={pkgList}
        poolConfigs={poolConfigs ?? []}
        defaultPoolId={defaultPoolId}
      />

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-slate-600 text-xs uppercase tracking-widest">Oder</span>
        <div className="flex-1 h-px bg-slate-800" />
      </div>

      <CustomQuoteForm />
    </div>
  )
}
