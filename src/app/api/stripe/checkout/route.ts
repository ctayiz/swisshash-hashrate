import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const stripeConfigured =
  !!process.env.STRIPE_SECRET_KEY &&
  !process.env.STRIPE_SECRET_KEY.includes('sk_live_...') &&
  !process.env.STRIPE_SECRET_KEY.includes('sk_test_...')

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { package_id, pool_config_id } = body

    if (!package_id) return NextResponse.json({ error: 'package_id required' }, { status: 400 })

    const adminClient = createAdminClient()
    const { data: pkg, error: pkgError } = await adminClient
      .from('packages')
      .select('*')
      .eq('id', package_id)
      .single()

    if (pkgError || !pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    if (!pkg.is_active) return NextResponse.json({ error: 'Package unavailable' }, { status: 400 })

    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert({
        customer_id: user.id,
        package_id,
        pool_config_id: pool_config_id ?? null,
        hashrate_th: pkg.hashrate_th,
        duration_days: pkg.duration_days,
        price_usd: pkg.price_usd,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    await adminClient.from('order_events').insert({
      order_id: order.id,
      event_type: 'created',
      actor_id: user.id,
      metadata: { payment_method: stripeConfigured ? 'stripe' : 'manual', package_id },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Skip Stripe if not configured — redirect directly to order page
    if (!stripeConfigured) {
      return NextResponse.json({ url: `${appUrl}/orders/${order.id}?payment=pending` })
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(pkg.price_usd * 100),
            product_data: {
              name: pkg.name,
              description: `${pkg.hashrate_th} TH/s · ${pkg.duration_days} ${pkg.duration_days === 1 ? 'Tag' : 'Tage'}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { order_id: order.id, customer_id: user.id },
      success_url: `${appUrl}/orders/${order.id}?payment=success`,
      cancel_url: `${appUrl}/packages?payment=cancelled`,
    })

    await adminClient
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe/checkout]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
