'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  expiresAt: string
  activatedAt: string
}

function calc(expiresAt: string, activatedAt: string) {
  const now = Date.now()
  const end = new Date(expiresAt).getTime()
  const start = new Date(activatedAt).getTime()
  const remaining = Math.max(0, end - now)
  const total = end - start
  const progress = total > 0 ? Math.max(0, Math.min(100, ((total - remaining) / total) * 100)) : 100

  const d = Math.floor(remaining / 86400000)
  const h = Math.floor((remaining % 86400000) / 3600000)
  const m = Math.floor((remaining % 3600000) / 60000)
  const s = Math.floor((remaining % 60000) / 1000)

  return { d, h, m, s, remaining, progress }
}

export function CountdownTimer({ expiresAt, activatedAt }: Props) {
  const [state, setState] = useState<ReturnType<typeof calc> | null>(null)

  useEffect(() => {
    setState(calc(expiresAt, activatedAt))
    const id = setInterval(() => setState(calc(expiresAt, activatedAt)), 1000)
    return () => clearInterval(id)
  }, [expiresAt, activatedAt])

  const expired = state?.remaining === 0
  const urgent  = !!state && !expired && state.remaining < 3600000 * 24 // < 1 day
  const remainingPct = state ? 100 - state.progress : 100

  return (
    <div className="space-y-2">
      {/* Countdown digits */}
      <div className="flex items-center gap-1.5">
        {!state ? (
          <>
            <TimeUnit value={0} label="T" urgent={false} />
            <Sep />
            <TimeUnit value={0} label="Std" urgent={false} />
            <Sep />
            <TimeUnit value={0} label="Min" urgent={false} />
            <Sep />
            <TimeUnit value={0} label="Sek" urgent={false} />
          </>
        ) : expired ? (
          <span className="text-red-400 text-sm font-semibold">Abgelaufen</span>
        ) : (
          <>
            <TimeUnit value={state.d} label="T" urgent={urgent} />
            <Sep />
            <TimeUnit value={state.h} label="Std" urgent={urgent} />
            <Sep />
            <TimeUnit value={state.m} label="Min" urgent={urgent} />
            <Sep />
            <TimeUnit value={state.s} label="Sek" urgent={urgent} />
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            expired ? 'bg-red-500' : urgent ? 'bg-yellow-400' : 'bg-green-500'
          )}
          style={{ width: `${remainingPct}%` }}
        />
      </div>
    </div>
  )
}

function TimeUnit({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
  return (
    <div className={cn(
      'flex items-baseline gap-0.5 font-mono',
      urgent ? 'text-yellow-400' : 'text-white'
    )}>
      <span className="text-sm font-bold">{String(value).padStart(2, '0')}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

function Sep() {
  return <span className="text-slate-600 text-xs font-bold">:</span>
}
