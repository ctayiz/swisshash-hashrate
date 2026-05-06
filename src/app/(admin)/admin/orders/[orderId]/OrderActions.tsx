'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, XCircle, PauseCircle, PlayCircle, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { OrderStatus } from '@/types/domain'

type Action = 'activate' | 'pause' | 'resume' | 'cancel' | 'reactivate' | 'delete'

const ACTION_CONFIG: Record<Action, { label: string; loadingLabel: string; icon: React.ElementType; className: string }> = {
  activate:   { label: 'Aktivieren',    loadingLabel: 'Aktiviere...',    icon: CheckCircle2, className: 'bg-green-600 hover:bg-green-700 text-white' },
  pause:      { label: 'Pausieren',     loadingLabel: 'Pausiere...',     icon: PauseCircle,  className: 'bg-blue-600 hover:bg-blue-700 text-white' },
  resume:     { label: 'Fortsetzen',    loadingLabel: 'Fortsetze...',    icon: PlayCircle,   className: 'bg-green-600 hover:bg-green-700 text-white' },
  cancel:     { label: 'Stoppen',       loadingLabel: 'Stoppe...',       icon: XCircle,      className: 'bg-red-600 hover:bg-red-700 text-white' },
  reactivate: { label: 'Reaktivieren',  loadingLabel: 'Reaktiviere...', icon: RotateCcw,    className: 'bg-orange-600 hover:bg-orange-700 text-white' },
  delete:     { label: 'Löschen',       loadingLabel: 'Lösche...',       icon: Trash2,       className: 'bg-slate-600 hover:bg-slate-700 text-white' },
}

const ACTIONS_BY_STATUS: Record<OrderStatus, Action[]> = {
  pending:   ['activate', 'cancel'],
  active:    ['pause', 'cancel'],
  paused:    ['resume', 'cancel'],
  cancelled: ['reactivate', 'delete'],
  expired:   ['delete'],
}

export function OrderActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter()
  const [loading, setLoading] = useState<Action | null>(null)

  const availableActions = ACTIONS_BY_STATUS[status] ?? []

  async function handleAction(action: Action) {
    if (action === 'delete' && !confirm('Bestellung wirklich löschen? Dies kann nicht rückgängig gemacht werden.')) return

    setLoading(action)
    try {
      const method = action === 'delete' ? 'DELETE' : 'POST'
      const endpoint = action === 'delete'
        ? `/api/orders/${orderId}/delete`
        : `/api/orders/${orderId}/${action}`

      const res = await fetch(endpoint, { method })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const messages: Record<Action, string> = {
        activate:   'Bestellung aktiviert',
        pause:      'Bestellung pausiert',
        resume:     'Bestellung fortgesetzt',
        cancel:     'Bestellung gestoppt',
        reactivate: 'Bestellung reaktiviert',
        delete:     'Bestellung gelöscht',
      }

      toast.success(messages[action])

      if (action === 'delete') {
        router.push('/admin/orders')
      } else {
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLoading(null)
    }
  }

  if (availableActions.length === 0) return null

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-4 flex items-center justify-between">
        <p className="text-slate-300 text-sm">Aktionen für diese Bestellung:</p>
        <div className="flex gap-3 flex-wrap">
          {availableActions.map(action => {
            const cfg = ACTION_CONFIG[action]
            const Icon = cfg.icon
            return (
              <Button
                key={action}
                onClick={() => handleAction(action)}
                disabled={loading !== null}
                className={cfg.className}
              >
                <Icon className="w-4 h-4 mr-2" />
                {loading === action ? cfg.loadingLabel : cfg.label}
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
