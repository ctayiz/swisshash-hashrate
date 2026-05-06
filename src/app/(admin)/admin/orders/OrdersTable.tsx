'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { CheckCircle2, PauseCircle, PlayCircle, XCircle, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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

const BULK_ACTIONS = [
  { action: 'activate',   label: 'Aktivieren',   icon: CheckCircle2, className: 'bg-green-600 hover:bg-green-700 text-white' },
  { action: 'pause',      label: 'Pausieren',    icon: PauseCircle,  className: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { action: 'resume',     label: 'Fortsetzen',   icon: PlayCircle,   className: 'bg-green-600 hover:bg-green-700 text-white' },
  { action: 'cancel',     label: 'Stoppen',      icon: XCircle,      className: 'bg-red-600 hover:bg-red-700 text-white' },
  { action: 'reactivate', label: 'Reaktivieren', icon: RotateCcw,    className: 'bg-orange-600 hover:bg-orange-700 text-white' },
  { action: 'delete',     label: 'Löschen',      icon: Trash2,       className: 'bg-slate-600 hover:bg-slate-700 text-white' },
]

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)

  const allSelected = orders.length > 0 && selected.size === orders.length

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(orders.map(o => o.id)))
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleBulkAction(action: string) {
    if (action === 'delete' && !confirm(`${selected.size} Bestellung(en) wirklich löschen?`)) return

    setLoading(action)
    try {
      const res = await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: [...selected], action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const ok = data.results.filter((r: { ok: boolean }) => r.ok).length
      const fail = data.results.length - ok

      if (ok > 0) toast.success(`${ok} Bestellung(en) erfolgreich`)
      if (fail > 0) toast.error(`${fail} Bestellung(en) fehlgeschlagen`)

      setSelected(new Set())
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-slate-800 border border-orange-500/30 rounded-lg flex-wrap">
          <span className="text-orange-400 text-sm font-medium shrink-0">
            {selected.size} ausgewählt
          </span>
          <div className="flex gap-2 flex-wrap">
            {BULK_ACTIONS.map(({ action, label, icon: Icon, className }) => (
              <Button
                key={action}
                size="sm"
                disabled={loading !== null}
                onClick={() => handleBulkAction(action)}
                className={className}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {loading === action ? '...' : label}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-400 hover:text-white ml-auto"
            onClick={() => setSelected(new Set())}
          >
            Abwählen
          </Button>
        </div>
      )}

      <Card className="bg-slate-800/50 border-slate-700">
        <div className="divide-y divide-slate-700">
          {/* Header */}
          <div className="grid grid-cols-[2rem_2fr_1fr_1fr_1fr_1fr] px-4 py-3 text-xs text-slate-500 uppercase tracking-wide items-center">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 rounded accent-orange-500 cursor-pointer"
            />
            <span>Paket</span>
            <span>Kunde</span>
            <span>Hashrate</span>
            <span>Preis</span>
            <span>Status</span>
          </div>

          {orders.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">Keine Bestellungen</div>
          )}

          {orders.map(order => (
            <div
              key={order.id}
              className={`grid grid-cols-[2rem_2fr_1fr_1fr_1fr_1fr] px-4 py-3 items-center transition-colors ${
                selected.has(order.id) ? 'bg-orange-500/5' : 'hover:bg-slate-700/30'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(order.id)}
                onChange={() => toggleOne(order.id)}
                className="w-4 h-4 rounded accent-orange-500 cursor-pointer"
              />
              <Link href={`/admin/orders/${order.id}`} className="min-w-0">
                <p className="text-white text-sm truncate">{order.package?.name ?? `${order.hashrate_th} TH`}</p>
                <p className="text-slate-500 text-xs font-mono">{order.id.slice(0, 8)}</p>
              </Link>
              <span className="text-slate-400 text-sm truncate">{order.customer?.email ?? '—'}</span>
              <span className="text-slate-300 text-sm">{order.hashrate_th} TH/s</span>
              <span className="text-slate-300 text-sm">${order.price_usd}</span>
              <OrderStatusBadge status={order.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
