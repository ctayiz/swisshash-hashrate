import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { OrdersTable } from './OrdersTable'
import Link from 'next/link'
import { Download } from 'lucide-react'
import type { OrderStatus } from '@/types/domain'

interface OrderRow {
  id: string
  hashrate_th: number
  price_usd: number
  status: OrderStatus
  created_at: string
  package: { name: string } | null
  customer: { email: string } | null
}

export default async function AdminOrdersPage() {
  await requireAdmin()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('orders')
    .select('id, hashrate_th, price_usd, status, created_at, customer:profiles!orders_customer_id_fkey(email), package:packages!orders_package_id_fkey(name)')
    .order('created_at', { ascending: false })

  if (error) console.error('[admin/orders]', error.message)

  const orders = (data ?? []) as unknown as OrderRow[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alle Bestellungen</h1>
          <p className="text-slate-400 mt-1">{orders.length} Bestellungen insgesamt</p>
        </div>
        <Link
          href="/api/admin/export/orders"
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          CSV Export
        </Link>
      </div>
      <OrdersTable orders={orders} />
    </div>
  )
}
