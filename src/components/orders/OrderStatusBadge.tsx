import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/types/domain'

const config: Record<OrderStatus, { label: string; className: string }> = {
  pending:   { label: 'Ausstehend', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  active:    { label: 'Aktiv',      className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  paused:    { label: 'Pausiert',   className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  expired:   { label: 'Abgelaufen', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  cancelled: { label: 'Gestoppt',   className: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = config[status] ?? config.expired
  return <Badge className={className}>{label}</Badge>
}
