import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { activateOrder } from '@/lib/orders/activate'
import crypto from 'crypto'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('btcpay-sig1') ?? ''
  const secret = process.env.BTCPAY_WEBHOOK_SECRET ?? ''

  // Verify HMAC-SHA256 signature from BTCPay
  if (secret) {
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
    if (sig !== expected) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let event: { type: string; invoiceId: string }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only handle settled/confirmed invoices
  if (!['InvoiceSettled', 'InvoicePaymentSettled'].includes(event.type)) {
    return NextResponse.json({ received: true })
  }

  const admin = createAdminClient()

  // Find order by BTCPay invoice ID (stored as "btcpay:<invoiceId>")
  const { data: order } = await admin
    .from('orders')
    .select('id, status')
    .eq('stripe_session_id', `btcpay:${event.invoiceId}`)
    .single()

  if (!order || order.status !== 'pending') {
    return NextResponse.json({ received: true })
  }

  // Record payment event
  await admin.from('order_events').insert({
    order_id: order.id,
    event_type: 'payment_received',
    metadata: { provider: 'btcpay', invoice_id: event.invoiceId, event_type: event.type },
  })

  // Activate and trigger proxy rebuild
  await activateOrder(order.id)

  const rebuildSecret = process.env.REBUILD_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  if (rebuildSecret) {
    fetch(`${appUrl}/api/proxy/rebuild`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rebuildSecret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger_source: 'order_activated', trigger_order_id: order.id }),
    }).catch(() => {})
  }

  return NextResponse.json({ received: true })
}
