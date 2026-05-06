import { createAdminClient } from '@/lib/supabase/admin'

export interface ExpireResult {
  expiredCount: number
  expiredOrderIds: string[]
}

export async function expireOverdueOrders(): Promise<ExpireResult> {
  const supabase = createAdminClient()

  const { data: overdueOrders, error: fetchError } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'active')
    .lte('expires_at', new Date().toISOString())

  if (fetchError) throw new Error(`Failed to fetch overdue orders: ${fetchError.message}`)
  if (!overdueOrders || overdueOrders.length === 0) {
    return { expiredCount: 0, expiredOrderIds: [] }
  }

  const ids = overdueOrders.map(o => o.id)

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'expired', paused_at: null, remaining_seconds: null })
    .in('id', ids)

  if (updateError) throw new Error(`Failed to expire orders: ${updateError.message}`)

  const events = ids.map(id => ({
    order_id: id,
    event_type: 'expired' as const,
    actor_id: null,
    metadata: { expired_at: new Date().toISOString(), triggered_by: 'cron' },
  }))

  await supabase.from('order_events').insert(events)

  return { expiredCount: ids.length, expiredOrderIds: ids }
}
