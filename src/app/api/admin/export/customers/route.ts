import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false })

  // Order counts per customer
  const { data: orderCounts } = await admin
    .from('orders')
    .select('customer_id, price_usd')

  const revenueByCustomer: Record<string, number> = {}
  const countByCustomer: Record<string, number> = {}
  for (const o of orderCounts ?? []) {
    revenueByCustomer[o.customer_id] = (revenueByCustomer[o.customer_id] ?? 0) + Number(o.price_usd)
    countByCustomer[o.customer_id] = (countByCustomer[o.customer_id] ?? 0) + 1
  }

  const header = ['ID', 'E-Mail', 'Name', 'Rolle', 'Bestellungen', 'Umsatz (USD)', 'Registriert']
  const lines = (profiles ?? []).map(p => [
    p.id,
    p.email,
    p.full_name ?? '',
    p.role,
    countByCustomer[p.id] ?? 0,
    (revenueByCustomer[p.id] ?? 0).toFixed(2),
    p.created_at ? new Date(p.created_at).toLocaleString('de-DE') : '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))

  const csv = [header.join(';'), ...lines].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="swisshash-customers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
