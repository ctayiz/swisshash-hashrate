'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Bitcoin } from 'lucide-react'

interface MiningStats {
  btcPriceUsd: number
  dailyBtcPerTH: number
}

interface Props {
  hashrates: number[]
  durations: number[]
}

export function ProfitabilityBanner({ hashrates, durations }: Props) {
  const [stats, setStats] = useState<MiningStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/mining/stats')
      .then(r => r.json())
      .then(d => { if (d.btcPriceUsd) setStats(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 animate-pulse h-20" />
    )
  }

  if (!stats) return null

  const { btcPriceUsd, dailyBtcPerTH } = stats

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-orange-400" />
        <span className="text-slate-300 text-sm font-medium">Geschätzte Erträge</span>
        <span className="text-slate-500 text-xs">(aktueller BTC-Preis & Difficulty)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-xs uppercase tracking-wide">
              <td className="pb-2 pr-4">Hashrate</td>
              {durations.map(d => (
                <td key={d} className="pb-2 pr-4 text-right">
                  {d} {d === 1 ? 'Tag' : 'Tage'}
                </td>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {hashrates.map(th => {
              const dailyBtc = dailyBtcPerTH * th
              const dailyUsd = dailyBtc * btcPriceUsd
              return (
                <tr key={th}>
                  <td className="py-2 pr-4 text-white font-medium">{th} TH/s</td>
                  {durations.map(days => {
                    const btcEarned = dailyBtc * days
                    const usdEarned = dailyUsd * days
                    return (
                      <td key={days} className="py-2 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Bitcoin className="w-3 h-3 text-orange-400" />
                          <span className="text-white font-mono text-xs">
                            {btcEarned.toFixed(6)}
                          </span>
                          <span className="text-slate-500 text-xs">
                            ≈ ${usdEarned.toFixed(2)}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-slate-600 text-xs mt-3">
        BTC ${btcPriceUsd.toLocaleString('de-DE')} · Schätzwert ohne Garantie · Erträge gehen direkt an deinen Pool
      </p>
    </div>
  )
}
