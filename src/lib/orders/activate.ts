import { createAdminClient } from '@/lib/supabase/admin'
import type { TriggerSource } from '@/types/domain'

const SECONDS_PER_DAY = 24 * 60 * 60

export interface OrderActionResult {
  proxyTrigger: TriggerSource
  wasActive?: boolean
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000)
}

function durationSeconds(durationDays: number): number {
  return durationDays * SECONDS_PER_DAY
}

function secondsUntil(expiresAt: string, now: Date): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / 1000))
}

export async function activateOrder(
  orderId: string,
  activatedBy: string | null
): Promise<OrderActionResult> {
  const supabase = createAdminClient()

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, duration_days, hashrate_th')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) throw new Error('Order not found')
  if (order.status !== 'pending') throw new Error(`Order is already ${order.status}`)

  const activatedAt = new Date()
  const expiresAt = addSeconds(activatedAt, durationSeconds(order.duration_days))

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'active',
      activated_at: activatedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      paused_at: null,
      remaining_seconds: null,
      activated_by: activatedBy,
    })
    .eq('id', orderId)

  if (error) throw new Error(`Failed to activate order: ${error.message}`)

  await supabase.from('order_events').insert({
    order_id: orderId,
    event_type: 'activated',
    actor_id: activatedBy,
    metadata: {
      activated_at: activatedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      duration_seconds: durationSeconds(order.duration_days),
      triggered_by: activatedBy ? 'admin' : 'stripe_webhook',
    },
  })

  return { proxyTrigger: 'order_activated' }
}

export async function pauseOrder(orderId: string, actorId: string): Promise<OrderActionResult> {
  const supabase = createAdminClient()
  const now = new Date()

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, expires_at')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) throw new Error('Order not found')
  if (order.status !== 'active') throw new Error('Only active orders can be paused')

  if (!order.expires_at || new Date(order.expires_at).getTime() <= now.getTime()) {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'expired',
        expires_at: order.expires_at ?? now.toISOString(),
        paused_at: null,
        remaining_seconds: null,
      })
      .eq('id', orderId)

    if (error) throw new Error(`Failed to expire order: ${error.message}`)

    await supabase.from('order_events').insert({
      order_id: orderId,
      event_type: 'expired',
      actor_id: actorId,
      metadata: { expired_at: now.toISOString(), triggered_by: 'pause_attempt' },
    })

    return { proxyTrigger: 'order_expired' }
  }

  const remainingSeconds = secondsUntil(order.expires_at, now)
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'paused',
      paused_at: now.toISOString(),
      remaining_seconds: remainingSeconds,
      expires_at: null,
    })
    .eq('id', orderId)

  if (error) throw new Error(`Failed to pause order: ${error.message}`)

  await supabase.from('order_events').insert({
    order_id: orderId,
    event_type: 'paused',
    actor_id: actorId,
    metadata: { paused_at: now.toISOString(), remaining_seconds: remainingSeconds },
  })

  return { proxyTrigger: 'order_paused' }
}

export async function resumeOrder(orderId: string, actorId: string): Promise<OrderActionResult> {
  const supabase = createAdminClient()
  const now = new Date()

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, remaining_seconds')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) throw new Error('Order not found')
  if (order.status !== 'paused') throw new Error('Only paused orders can be resumed')
  if (!order.remaining_seconds || order.remaining_seconds <= 0) {
    throw new Error('Paused order has no remaining mining time')
  }

  const expiresAt = addSeconds(now, order.remaining_seconds)

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'active',
      expires_at: expiresAt.toISOString(),
      paused_at: null,
      remaining_seconds: null,
    })
    .eq('id', orderId)

  if (error) throw new Error(`Failed to resume order: ${error.message}`)

  await supabase.from('order_events').insert({
    order_id: orderId,
    event_type: 'resumed',
    actor_id: actorId,
    metadata: {
      resumed_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      restored_seconds: order.remaining_seconds,
    },
  })

  return { proxyTrigger: 'order_resumed' }
}

export async function reactivateOrder(orderId: string, actorId: string): Promise<OrderActionResult> {
  const supabase = createAdminClient()
  const now = new Date()

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, duration_days, activated_at, expires_at, remaining_seconds')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) throw new Error('Order not found')
  if (order.status !== 'cancelled') throw new Error('Only cancelled orders can be reactivated')

  const restoredSeconds =
    order.remaining_seconds && order.remaining_seconds > 0
      ? order.remaining_seconds
      : order.expires_at && new Date(order.expires_at).getTime() > now.getTime()
        ? secondsUntil(order.expires_at, now)
        : !order.activated_at
          ? durationSeconds(order.duration_days)
          : 0

  if (restoredSeconds <= 0) {
    throw new Error('Cancelled order has no remaining mining time')
  }

  const expiresAt = addSeconds(now, restoredSeconds)

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'active',
      activated_at: order.activated_at ?? now.toISOString(),
      expires_at: expiresAt.toISOString(),
      paused_at: null,
      remaining_seconds: null,
      activated_by: actorId,
    })
    .eq('id', orderId)

  if (error) throw new Error(`Failed to reactivate order: ${error.message}`)

  await supabase.from('order_events').insert({
    order_id: orderId,
    event_type: 'reactivated',
    actor_id: actorId,
    metadata: {
      reactivated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      restored_seconds: restoredSeconds,
    },
  })

  return { proxyTrigger: 'order_reactivated' }
}

export async function cancelOrder(
  orderId: string,
  cancelledBy: string,
  notes?: string
): Promise<OrderActionResult> {
  const supabase = createAdminClient()
  const now = new Date()

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, expires_at, remaining_seconds')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) throw new Error('Order not found')
  if (order.status === 'expired' || order.status === 'cancelled') {
    throw new Error(`Order is already ${order.status}`)
  }

  const wasActive = order.status === 'active' || order.status === 'paused'
  const remainingSeconds =
    order.status === 'active' && order.expires_at
      ? secondsUntil(order.expires_at, now)
      : order.status === 'paused'
        ? order.remaining_seconds
        : null

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      notes: notes ?? null,
      expires_at: null,
      paused_at: null,
      remaining_seconds: remainingSeconds,
    })
    .eq('id', orderId)

  if (error) throw new Error(`Failed to cancel order: ${error.message}`)

  await supabase.from('order_events').insert({
    order_id: orderId, event_type: 'cancelled', actor_id: cancelledBy,
    metadata: { notes, was_active: wasActive, remaining_seconds: remainingSeconds },
  })

  return { proxyTrigger: 'order_cancelled', wasActive }
}

export async function deleteOrder(orderId: string, force = false): Promise<void> {
  const supabase = createAdminClient()

  const { data: order, error: fetchError } = await supabase
    .from('orders').select('id, status').eq('id', orderId).single()

  if (fetchError || !order) throw new Error('Order not found')

  // Auto-cancel if force mode and order is not already in a terminal state
  if (force && order.status !== 'cancelled' && order.status !== 'expired') {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
  } else if (!force && order.status !== 'cancelled' && order.status !== 'expired') {
    throw new Error('Only cancelled or expired orders can be deleted')
  }

  // Clear FK reference in proxy_config_versions before deleting
  await supabase
    .from('proxy_config_versions')
    .update({ trigger_order_id: null } as never)
    .eq('trigger_order_id', orderId)

  const { error } = await supabase.from('orders').delete().eq('id', orderId)
  if (error) throw new Error(`Failed to delete order: ${error.message}`)
}
