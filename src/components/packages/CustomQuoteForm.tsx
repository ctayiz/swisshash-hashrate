'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { MessageSquarePlus, Zap, Clock, CheckCircle2, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CustomQuoteForm() {
  const [hashrate, setHashrate] = useState('')
  const [duration, setDuration] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hashrate || !duration) return

    setLoading(true)
    try {
      const res = await fetch('/api/orders/custom-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hashrate_th: Number(hashrate),
          duration_days: Number(duration),
          message,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSent(true)
      toast.success('Anfrage gesendet — wir melden uns bald!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Senden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      {/* Subtle gradient accent top-left */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/30 via-transparent to-transparent pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0">

        {/* Left — explanation */}
        <div className="p-8 lg:border-r border-slate-700">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-slate-700 rounded-xl">
              <MessageSquarePlus className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">Individuelles Angebot</h3>
              <p className="text-slate-400 text-sm">Kein passendes Paket gefunden?</p>
            </div>
          </div>

          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Wenn du eine andere Hashrate oder Laufzeit benötigst, stellen wir dir gerne
            ein maßgeschneidertes Angebot zusammen. Fülle einfach das Formular aus —
            wir melden uns innerhalb von 24 Stunden.
          </p>

          <ul className="space-y-3">
            {[
              { icon: Zap,  text: 'Beliebige Hashrate — z. B. 1.000 TH/s oder mehr' },
              { icon: Clock, text: 'Individuelle Laufzeiten — Wochen oder Monate möglich' },
              { icon: CheckCircle2, text: 'Persönliche Betreuung und individueller Preis' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-slate-400">
                <Icon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form */}
        <div className="p-8">
          {sent ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-8">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Anfrage gesendet!</p>
                <p className="text-slate-400 text-sm mt-1">
                  Wir werden uns innerhalb von 24 Stunden bei dir melden.
                </p>
              </div>
              <button
                onClick={() => { setSent(false); setHashrate(''); setDuration(''); setMessage('') }}
                className="text-orange-400 hover:text-orange-300 text-sm transition-colors"
              >
                Neue Anfrage stellen
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">
                    Hashrate (TH/s)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="z. B. 1000"
                      value={hashrate}
                      onChange={e => setHashrate(e.target.value)}
                      required
                      className={cn(
                        'w-full bg-slate-700/80 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm',
                        'placeholder:text-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30',
                        'transition-colors'
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">
                      TH/s
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">
                    Laufzeit (Tage)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="z. B. 30"
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      required
                      className={cn(
                        'w-full bg-slate-700/80 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm',
                        'placeholder:text-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30',
                        'transition-colors'
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">
                      Tage
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">
                  Nachricht <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Besondere Anforderungen, Fragen oder weitere Details..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className={cn(
                    'w-full bg-slate-700/80 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm',
                    'placeholder:text-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30',
                    'transition-colors resize-none'
                  )}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !hashrate || !duration}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all',
                  'bg-slate-600 hover:bg-slate-500 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Angebot anfragen
                  </>
                )}
              </button>

              <p className="text-slate-600 text-xs text-center">
                Wir antworten auf deine registrierte E-Mail-Adresse.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
