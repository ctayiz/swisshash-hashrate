import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { activateOrder } from '@/lib/orders/activate'

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== 'paid') return NextResponse.json({ received: true })

    const orderId = session.metadata?.order_id
    if (!orderId) return NextResponse.json({ received: true })

    try {
      const adminClient = createAdminClient()

      // Store payment intent
      await adminClient
        .from('orders')
        .update({ stripe_payment_intent: session.payment_intent as string })
        .eq('id', orderId)

      await adminClient.from('order_events').insert({
        order_id: orderId,
        event_type: 'payment_received',
        actor_id: null,
        metadata: {
          stripe_session_id: session.id,
          payment_intent: session.payment_intent as string | null,
          amount_total: session.amount_total,
        },
      })

      // Auto-activate after payment
      await activateOrder(orderId, null)

      // Trigger proxy rebuild
      const rebuildUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/proxy/rebuild`
      await fetch(rebuildUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.REBUILD_SECRET}`,
        },
        body: JSON.stringify({ trigger_source: 'order_activated', trigger_order_id: orderId }),
      })
    } catch (err) {
      console.error('[stripe/webhook] activation failed:', err)
      // Don't return error — Stripe would retry; log and handle manually
    }
  }

  return NextResponse.json({ received: true })
}
