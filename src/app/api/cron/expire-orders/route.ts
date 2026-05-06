import { NextResponse } from 'next/server'
import { expireOverdueOrders } from '@/lib/orders/expire'

export async function GET() {
  // Secured by CRON_SECRET — validated in middleware
  try {
    const { expiredCount, expiredOrderIds } = await expireOverdueOrders()

    let rebuildTriggered = false
    if (expiredCount > 0) {
      const rebuildUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/proxy/rebuild`
      const res = await fetch(rebuildUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.REBUILD_SECRET}`,
        },
        body: JSON.stringify({ trigger_source: 'order_expired' }),
      })
      rebuildTriggered = res.ok
    }

    return NextResponse.json({
      expired_count: expiredCount,
      expired_order_ids: expiredOrderIds,
      rebuild_triggered: rebuildTriggered,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[cron/expire-orders]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
