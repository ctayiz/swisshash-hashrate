import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const btcpayUrl = process.env.BTCPAY_URL
    const apiKey = process.env.BTCPAY_API_KEY
    const storeId = process.env.BTCPAY_STORE_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    if (!btcpayUrl || !apiKey || !storeId) {
      return NextResponse.json({ error: 'BTCPay nicht konfiguriert' }, { status: 503 })
    }

    const { order_id } = await request.json()
    if (!order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 })

    const admin = createAdminClient()
    const { data: order } = await admin
      .from('orders')
      .select('id, price_usd, hashrate_th, duration_days, package:packages(name)')
      .eq('id', order_id)
      .eq('customer_id', user.id)
      .single()

    if (!order) return NextResponse.json({ error: 'Order nicht gefunden' }, { status: 404 })

    const pkgName = (order.package as { name: string } | null)?.name ?? `${order.hashrate_th} TH/s`

    // Create BTCPay invoice
    const res = await fetch(`${btcpayUrl}/api/v1/stores/${storeId}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${apiKey}`,
      },
      body: JSON.stringify({
        amount: order.price_usd,
        currency: 'USD',
        metadata: {
          orderId: order.id,
          buyerEmail: user.email,
          itemDesc: pkgName,
        },
        checkout: {
          redirectURL: `${appUrl}/orders/${order.id}?payment=success`,
          redirectAutomatically: true,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `BTCPay Fehler: ${err}` }, { status: 502 })
    }

    const invoice = await res.json()

    // Store BTCPay invoice ID in order for webhook matching
    await admin
      .from('orders')
      .update({ stripe_session_id: `btcpay:${invoice.id}` })
      .eq('id', order.id)

    return NextResponse.json({ url: invoice.checkoutLink })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 500 })
  }
}
