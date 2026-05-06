import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { activateOrder, pauseOrder, resumeOrder, cancelOrder, reactivateOrder, deleteOrder } from '@/lib/orders/activate'
import { generateAndSaveProxyConfig } from '@/lib/proxy/generator'
import type { TriggerSource } from '@/types/domain'

const PROXY_ACTIONS = new Set(['activate', 'pause', 'resume', 'cancel', 'reactivate'])

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { orderIds, action }: { orderIds: string[]; action: string } = await request.json()
    if (!orderIds?.length || !action) return NextResponse.json({ error: 'orderIds and action required' }, { status: 400 })

    const results: { id: string; ok: boolean; error?: string }[] = []
    const proxyTriggers: TriggerSource[] = []

    for (const id of orderIds) {
      try {
        if (action === 'activate')        proxyTriggers.push((await activateOrder(id, user.id)).proxyTrigger)
        else if (action === 'pause')      proxyTriggers.push((await pauseOrder(id, user.id)).proxyTrigger)
        else if (action === 'resume')     proxyTriggers.push((await resumeOrder(id, user.id)).proxyTrigger)
        else if (action === 'cancel')     proxyTriggers.push((await cancelOrder(id, user.id)).proxyTrigger)
        else if (action === 'reactivate') proxyTriggers.push((await reactivateOrder(id, user.id)).proxyTrigger)
        else if (action === 'delete')     await deleteOrder(id, true)
        else throw new Error('Unknown action')
        results.push({ id, ok: true })
      } catch (err) {
        results.push({ id, ok: false, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    // Trigger proxy rebuild once if any proxy-relevant action succeeded
    const anySuccess = results.some(r => r.ok)
    if (anySuccess && PROXY_ACTIONS.has(action)) {
      const uniqueTriggers = [...new Set(proxyTriggers)]
      await generateAndSaveProxyConfig(uniqueTriggers.length === 1 ? uniqueTriggers[0] : 'manual')
    }

    return NextResponse.json({ results })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
