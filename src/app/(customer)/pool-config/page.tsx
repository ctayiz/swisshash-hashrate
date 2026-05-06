import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PoolConfigManager } from './PoolConfigManager'

export default async function PoolConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: configs } = await supabase
    .from('customer_pool_configs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Pool-Konfiguration</h1>
        <p className="text-slate-400 mt-1">Verwalte deine Mining-Pool-Verbindungen</p>
      </div>
      <PoolConfigManager configs={configs ?? []} userId={user.id} />
    </div>
  )
}
