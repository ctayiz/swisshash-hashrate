import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PackageGrid } from '@/components/packages/PackageGrid'
import type { Package } from '@/types/domain'

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  const defaultPoolId = poolConfigs?.find(p => p.is_default)?.id ?? poolConfigs?.[0]?.id ?? null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Pakete buchen</h1>
        <p className="text-slate-400 mt-1">
          Wähle dein Hashrate-Paket und starte sofort mit dem Mining
        </p>
      </div>

      <PackageGrid
        packages={packages as Package[] ?? []}
        poolConfigs={poolConfigs ?? []}
        defaultPoolId={defaultPoolId}
      />
    </div>
  )
}
