import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmation, sendAdminNewOrderNotification } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { package_id, pool_config_id } = body

    if (!package_id) {
      return NextResponse.json({ error: 'package_id required' }, { status: 400 })
    }

    // Load package to snapshot values
    const adminClient = createAdminClient()
    const { data: pkg, error: pkgError } = await adminClient
      .from('packages')
      .select('id, hashrate_th, duration_days, price_usd, is_active')
      .eq('id', package_id)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }
    if (!pkg.is_active) {
      return NextResponse.json({ error: 'Package is not available' }, { status: 400 })
    }

    // Verify pool_config belongs to user if provided
    if (pool_config_id) {
      const { data: pc } = await adminClient
        .from('customer_pool_configs')
        .select('id, user_id')
        .eq('id', pool_config_id)
        .single()

      if (!pc || pc.user_id !== user.id) {
        return NextResponse.json({ error: 'Invalid pool config' }, { status: 400 })
      }
    }

    const { data: order, error: insertError } = await adminClient
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

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    await adminClient.from('order_events').insert({
      order_id: order.id,
      event_type: 'created',
      actor_id: user.id,
      metadata: { package_id, price_usd: pkg.price_usd },
    })

    // Send confirmation email (non-blocking)
    const { data: pkgWithName } = await adminClient
      .from('packages').select('name').eq('id', package_id).single()
    const packageName = pkgWithName?.name ?? `${pkg.hashrate_th} TH/s`
    sendOrderConfirmation({
      to: user.email!,
      orderId: order.id,
      packageName,
      hashrate_th: pkg.hashrate_th,
      duration_days: pkg.duration_days,
      price_usd: pkg.price_usd,
    }).catch(() => {})
    sendAdminNewOrderNotification({
      customerEmail: user.email!,
      orderId: order.id,
      packageName,
      hashrate_th: pkg.hashrate_th,
      duration_days: pkg.duration_days,
      price_usd: pkg.price_usd,
    }).catch(() => {})

    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
