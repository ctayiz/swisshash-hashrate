import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data } = await admin
    .from('orders')
    .select('id, status, hashrate_th, duration_days, price_usd, created_at, activated_at, expires_at, customer:profiles(email), package:packages(name)')
    .order('created_at', { ascending: false })

  const rows = data ?? []
  const header = ['ID', 'Status', 'Kunde', 'Paket', 'Hashrate (TH/s)', 'Laufzeit (Tage)', 'Preis (USD)', 'Erstellt', 'Aktiviert', 'Läuft ab']
  const lines = rows.map(o => [
    o.id,
    o.status,
    (o.customer as { email: string } | null)?.email ?? '',
    (o.package as { name: string } | null)?.name ?? '',
    o.hashrate_th,
    o.duration_days,
    o.price_usd,
    o.created_at ? new Date(o.created_at).toLocaleString('de-DE') : '',
    o.activated_at ? new Date(o.activated_at).toLocaleString('de-DE') : '',
    o.expires_at ? new Date(o.expires_at).toLocaleString('de-DE') : '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))

  const csv = [header.join(';'), ...lines].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="swisshash-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
