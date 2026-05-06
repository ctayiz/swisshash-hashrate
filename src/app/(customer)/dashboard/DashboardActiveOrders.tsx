'use client'

import { Card, CardContent } from '@/components/ui/card'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { CountdownTimer } from '@/components/orders/CountdownTimer'
import { Zap } from 'lucide-react'
import Link from 'next/link'
import type { OrderStatus } from '@/types/domain'

interface OrderRow {
  id: string
  hashrate_th: number
  price_usd: number
  status: OrderStatus
  activated_at: string | null
  expires_at: string | null
  package: { name: string } | null
}

export function DashboardActiveOrders({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">Aktive Pakete</h2>
      <div className="grid gap-4">
        {orders.map(order => (
          <Link key={order.id} href={`/orders/${order.id}`}>
            <Card className="bg-slate-800/50 border-green-500/20 hover:border-green-500/40 transition-all cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Zap className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold group-hover:text-green-300 transition-colors">
                        {order.package?.name ?? `${order.hashrate_th} TH/s`}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">{order.hashrate_th} TH/s</p>
                    </div>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {order.activated_at && order.expires_at ? (
                  <CountdownTimer expiresAt={order.expires_at} activatedAt={order.activated_at} />
                ) : (
                  <p className="text-slate-500 text-xs">Noch nicht aktiviert</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
