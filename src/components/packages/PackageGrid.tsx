'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Zap, Clock, Settings, CheckCircle2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { Package, PoolConfig } from '@/types/domain'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const TIERS: Record<number, {
  label: string
  description: string
  color: string
  bg: string
  border: string
  glow: string
  highlight: boolean
}> = {
  120: {
    label: 'Starter',
    description: 'Ideal für den Einstieg ins Mining',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/10',
    highlight: false,
  },
  300: {
    label: 'Pro',
    description: 'Unsere beliebteste Option',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/40',
    glow: 'shadow-orange-500/20',
    highlight: true,
  },
  500: {
    label: 'Enterprise',
    description: 'Maximale Performance',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/10',
    highlight: false,
  },
}

const DURATION_LABELS: Record<number, string> = { 1: '1 Tag', 3: '3 Tage', 5: '5 Tage' }

export function PackageGrid({
  packages,
  poolConfigs,
  defaultPoolId,
}: {
  packages: Package[]
  poolConfigs: PoolConfig[]
  defaultPoolId?: string | null
}) {
  const router = useRouter()
  const [selectedPool, setSelectedPool] = useState<string>(defaultPoolId ?? 'none')
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmPkg, setConfirmPkg] = useState<Package | null>(null)
  const [currency, setCurrency] = useState<'EUR' | 'USD'>('EUR')
  const [eurRate, setEurRate] = useState<number>(0.92)
  const [selectedDurations, setSelectedDurations] = useState<Record<number, number>>({
    120: 3, 300: 3, 500: 3,
  })

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(d => { if (d?.rates?.EUR) setEurRate(d.rates.EUR) })
      .catch(() => {})
  }, [])

  function formatPrice(usd: number): string {
    if (currency === 'EUR') {
      return `€${(usd * eurRate).toFixed(2)}`
    }
    return `$${usd}`
  }

  const hashrates = [...new Set(packages.map(p => p.hashrate_th))].sort((a, b) => a - b)
  const durations  = [...new Set(packages.map(p => p.duration_days))].sort((a, b) => a - b)

  function getPackage(hashrate: number, duration: number): Package | undefined {
    return packages.find(p => p.hashrate_th === hashrate && p.duration_days === duration)
  }

  function handleBuy(pkg: Package) {
    if (poolConfigs.length === 0) {
      toast.error('Bitte richte zuerst eine Pool-Konfiguration ein', {
        action: { label: 'Einrichten →', onClick: () => router.push('/pool-config') },
      })
      return
    }
    if (selectedPool === 'none') {
      toast.error('Bitte wähle eine Pool-Konfiguration aus')
      return
    }
    setConfirmPkg(pkg)
  }

  async function handleConfirm() {
    if (!confirmPkg) return
    setLoading(confirmPkg.id)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: confirmPkg.id, pool_config_id: selectedPool }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Checkout')
      setLoading(null)
    }
    setConfirmPkg(null)
  }

  return (
    <div className="space-y-8">

      {/* Pool selector */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 shrink-0">
            {selectedPool !== 'none'
              ? <CheckCircle2 className="w-4 h-4 text-green-400" />
              : <AlertTriangle className="w-4 h-4 text-yellow-400" />
            }
            <span className="text-slate-300 text-sm font-medium">Mining-Pool</span>
          </div>

          {poolConfigs.length > 0 ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Select value={selectedPool} onValueChange={v => setSelectedPool(v ?? 'none')}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white max-w-xs">
                  <span className="truncate">
                    {selectedPool === 'none'
                      ? <span className="text-slate-400">Pool auswählen...</span>
                      : poolConfigs.find(p => p.id === selectedPool)?.name
                    }
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="none" className="text-slate-400">Pool auswählen...</SelectItem>
                  {poolConfigs.map(pc => (
                    <SelectItem key={pc.id} value={pc.id} className="text-white">{pc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link href="/pool-config">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white shrink-0">
                  <Settings className="w-3.5 h-3.5 mr-1.5" />
                  Neuer Pool
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 text-sm">Kein Pool konfiguriert.</span>
              <Link href="/pool-config">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Settings className="w-3.5 h-3.5 mr-1.5" />
                  Jetzt einrichten
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={!!confirmPkg} onOpenChange={open => { if (!open) setConfirmPkg(null) }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Bestellung bestätigen</DialogTitle>
          </DialogHeader>

          {confirmPkg && (() => {
            const tier = TIERS[confirmPkg.hashrate_th] ?? TIERS[120]
            const pool = poolConfigs.find(p => p.id === selectedPool)
            return (
              <div className="space-y-4 py-2">
                <div className={cn('rounded-xl p-4', tier.bg, 'border', tier.border)}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn('text-xs font-bold uppercase tracking-widest', tier.color)}>{tier.label}</span>
                    <Zap className={cn('w-4 h-4', tier.color)} />
                  </div>
                  <div className="space-y-2 text-sm">
                    <Row label="Hashrate"  value={`${confirmPkg.hashrate_th} TH/s`} />
                    <Row label="Laufzeit"  value={`${confirmPkg.duration_days} ${confirmPkg.duration_days === 1 ? 'Tag' : 'Tage'}`} />
                    <Row label="Pool"      value={pool?.name ?? '—'} />
                    <div className="border-t border-slate-600 pt-2 mt-2 flex justify-between">
                      <span className="text-slate-300 font-semibold">Gesamt</span>
                      <span className="text-white font-bold text-base">{formatPrice(confirmPkg.price_usd)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-400 text-xs text-center">
                  Die Bestellung wird nach Zahlungseingang aktiviert.
                </p>
              </div>
            )
          })()}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmPkg(null)}
              className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600 flex-1"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!!loading}
              className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Weiterleitung...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Jetzt bezahlen
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Currency toggle — above packages, right-aligned */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-xl p-1">
          {(['EUR', 'USD'] as const).map(c => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
                currency === c
                  ? 'bg-slate-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {c === 'EUR' ? '€ EUR' : '$ USD'}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {hashrates.map(hashrate => {
          const tier = TIERS[hashrate] ?? TIERS[120]
          const selectedDuration = selectedDurations[hashrate]
          const pkg = getPackage(hashrate, selectedDuration)

          return (
            <div
              key={hashrate}
              className={cn(
                'relative rounded-2xl border flex flex-col transition-all',
                'bg-slate-800/50 shadow-lg',
                tier.border,
                tier.glow,
                tier.highlight && 'ring-1 ring-orange-500/50 scale-[1.02]'
              )}
            >
              {tier.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Beliebteste Wahl
                  </span>
                </div>
              )}

              {/* Header */}
              <div className={cn('p-6 rounded-t-2xl', tier.bg)}>
                <div className="flex items-center justify-between mb-3">
                  <span className={cn('text-xs font-bold uppercase tracking-widest', tier.color)}>
                    {tier.label}
                  </span>
                  <div className={cn('p-1.5 rounded-lg', tier.bg, 'border', tier.border)}>
                    <Zap className={cn('w-4 h-4', tier.color)} />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{hashrate}</span>
                  <span className={cn('text-lg font-semibold', tier.color)}>TH/s</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">{tier.description}</p>
              </div>

              <div className="p-6 flex flex-col flex-1 gap-5">
                {/* Duration selector */}
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Laufzeit wählen</p>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-900/50 p-1 rounded-lg">
                    {durations.map(d => (
                      <button
                        key={d}
                        onClick={() => setSelectedDurations(s => ({ ...s, [hashrate]: d }))}
                        className={cn(
                          'py-1.5 rounded-md text-sm font-medium transition-all',
                          selectedDuration === d
                            ? cn('text-white', tier.highlight ? 'bg-orange-500' : 'bg-slate-600')
                            : 'text-slate-400 hover:text-white'
                        )}
                      >
                        {DURATION_LABELS[d]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">
                    {pkg ? formatPrice(pkg.price_usd) : '—'}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {[
                    `${hashrate} TH/s Hashrate`,
                    `${selectedDuration} ${selectedDuration === 1 ? 'Tag' : 'Tage'} Laufzeit`,
                    'Dein eigener Mining-Pool',
                    'Sofort aktiv nach Freischaltung',
                  ].map(feature => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 className={cn('w-4 h-4 shrink-0', tier.color)} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => pkg && handleBuy(pkg)}
                  disabled={!pkg || loading === pkg?.id}
                  className={cn(
                    'w-full font-semibold transition-all',
                    tier.highlight
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : cn('text-white border', tier.border, tier.bg, `hover:${tier.bg}`, 'hover:brightness-125')
                  )}
                >
                  {loading === pkg?.id ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Weiterleitung...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Jetzt buchen
                    </span>
                  )}
                </Button>

                <p className="text-center text-slate-500 text-xs flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  Aktivierung nach Zahlungseingang
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}
