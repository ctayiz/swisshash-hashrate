'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Server, Plus, Trash2, Star, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { PoolConfig } from '@/types/domain'

interface FormState {
  name: string
  pool_url: string
  pool_port: string
  worker_name: string
  password: string
}

// Parse a full stratum URL into { host, port }
// Handles: stratum+tcp://gate.emcd.network:3333  →  { host: 'gate.emcd.network', port: '3333' }
//          gate.emcd.network:3333                →  { host: 'gate.emcd.network', port: '3333' }
//          gate.emcd.network                     →  { host: 'gate.emcd.network', port: null }
function parseStratumUrl(raw: string): { host: string; port: string | null } {
  const stripped = raw.replace(/^(stratum\+tcp|stratum\+ssl|stratum\+tls|stratum):\/\//i, '').replace(/\s/g, '')
  const colonIdx = stripped.lastIndexOf(':')
  if (colonIdx !== -1) {
    const maybePort = stripped.slice(colonIdx + 1)
    if (/^\d+$/.test(maybePort)) {
      return { host: stripped.slice(0, colonIdx), port: maybePort }
    }
  }
  return { host: stripped, port: null }
}

function validatePort(port: string): string | undefined {
  if (!port) return 'Port ist erforderlich'
  const n = parseInt(port)
  if (isNaN(n) || !Number.isInteger(n)) return 'Port muss eine ganze Zahl sein'
  if (n < 1 || n > 65535) return 'Port muss zwischen 1 und 65535 liegen'
}

function validateWorker(worker: string): string | undefined {
  if (!worker.trim()) return 'Workername ist erforderlich'
  if (worker.includes(' ')) return 'Keine Leerzeichen erlaubt'
  if (!/^[a-z0-9_.\-]+$/i.test(worker)) return 'Nur Buchstaben, Zahlen, Punkte, _ und - erlaubt'
}

function validateUrl(url: string): string | undefined {
  if (!url) return 'Pool-URL ist erforderlich'
  if (url.includes(':')) return 'Kein Port in der URL — nutze das Port-Feld'
  if (!/^[a-z0-9]([a-z0-9\-.]*[a-z0-9])?$/i.test(url)) return 'Ungültiger Hostname'
  if (!url.includes('.')) return 'Hostname muss eine Domain enthalten (z.B. pool.example.com)'
}

// ── Step progress bar ────────────────────────────────────────────────────────

const STEPS = ['Name', 'Pool & Port', 'Worker', 'Zusammenfassung']

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${done ? 'bg-green-500 text-white' : active ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${active ? 'text-orange-400' : done ? 'text-green-400' : 'text-slate-500'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${done ? 'bg-green-500' : 'bg-slate-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Field helpers ────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />{msg}
    </p>
  )
}

function FieldOk({ show }: { show: boolean }) {
  if (!show) return null
  return <CheckCircle2 className="w-4 h-4 text-green-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-slate-700 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium font-mono">{value}</span>
    </div>
  )
}

// ── Wizard ───────────────────────────────────────────────────────────────────

function Wizard({ configs, userId, onDone }: { configs: PoolConfig[]; userId: string; onDone: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: '', pool_url: '', pool_port: '3333', worker_name: '', password: 'x',
  })

  const urlError    = validateUrl(form.pool_url)
  const portError   = validatePort(form.pool_port)
  const workerError = validateWorker(form.worker_name)
  const nameError   = !form.name.trim() ? 'Name ist erforderlich' : form.name.trim().length < 2 ? 'Mind. 2 Zeichen' : undefined

  function canAdvance() {
    if (step === 0) return !nameError
    if (step === 1) return !urlError && !portError
    if (step === 2) return !workerError
    return true
  }

  function next() {
    setTouched(true)
    if (!canAdvance()) return
    setTouched(false)
    setStep(s => s + 1)
  }

  function back() {
    setTouched(false)
    setStep(s => s - 1)
  }

  async function handleSave() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('customer_pool_configs').insert({
      user_id:     userId,
      name:        form.name.trim(),
      pool_url:    form.pool_url.trim(),
      pool_port:   parseInt(form.pool_port),
      worker_name: form.worker_name.trim(),
      password:    form.password || 'x',
      tls:         false,
      is_default:  configs.length === 0,
    })
    if (error) {
      toast.error('Fehler beim Speichern: ' + error.message)
    } else {
      toast.success('Pool-Konfiguration gespeichert')
      onDone()
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-base">Neue Pool-Konfiguration</CardTitle>
      </CardHeader>
      <CardContent>
        <StepBar current={step} />

        {/* Step 0 — Name */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">Gib deiner Pool-Konfiguration einen Namen damit du sie später leicht erkennst.</p>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Name <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  autoFocus
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && next()}
                  placeholder="z.B. Mein F2Pool"
                  className={`bg-slate-700 border-slate-600 text-white pr-9
                    ${touched && nameError ? 'border-red-500' : form.name.trim().length >= 2 ? 'border-green-500' : ''}`}
                />
                <FieldOk show={!nameError && form.name.length > 0} />
              </div>
              <FieldError msg={touched ? nameError : undefined} />
            </div>
          </div>
        )}

        {/* Step 1 — Pool URL + Port */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              Gib die Adresse deines Mining-Pools ein. Wenn du die URL aus deinem Pool kopierst und sie ein Prefix wie
              <code className="bg-slate-700 px-1 rounded mx-1 text-orange-300">stratum+tcp://</code>
              enthält, wird es automatisch entfernt.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-slate-300">Pool-URL <span className="text-red-400">*</span></Label>
                <div className="relative">
                  <Input
                    autoFocus
                    value={form.pool_url}
                    onChange={e => {
                      const { host, port } = parseStratumUrl(e.target.value)
                      setForm(f => ({ ...f, pool_url: host, ...(port ? { pool_port: port } : {}) }))
                    }}
                    onKeyDown={e => e.key === 'Enter' && next()}
                    placeholder="btc.f2pool.com"
                    className={`bg-slate-700 border-slate-600 text-white pr-9
                      ${touched && urlError ? 'border-red-500' : !urlError && form.pool_url ? 'border-green-500' : ''}`}
                  />
                  <FieldOk show={!urlError && form.pool_url.length > 0} />
                </div>
                <FieldError msg={touched ? urlError : undefined} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Port <span className="text-red-400">*</span></Label>
                <Input
                  value={form.pool_port}
                  onChange={e => setForm(f => ({ ...f, pool_port: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && next()}
                  type="number"
                  min={1}
                  max={65535}
                  className={`bg-slate-700 border-slate-600 text-white
                    ${touched && portError ? 'border-red-500' : !portError ? 'border-green-500' : ''}`}
                />
                <FieldError msg={touched ? portError : undefined} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Worker + Password */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              Der Workername ist dein Pool-Benutzername mit optionalem Worker-Suffix, z.B.
              <code className="bg-slate-700 px-1 rounded mx-1 text-orange-300">meinuser.worker1</code>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Workername <span className="text-red-400">*</span></Label>
                <div className="relative">
                  <Input
                    autoFocus
                    value={form.worker_name}
                    onChange={e => setForm(f => ({ ...f, worker_name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && next()}
                    placeholder="username.worker1"
                    className={`bg-slate-700 border-slate-600 text-white pr-9
                      ${touched && workerError ? 'border-red-500' : !workerError && form.worker_name ? 'border-green-500' : ''}`}
                  />
                  <FieldOk show={!workerError && form.worker_name.length > 0} />
                </div>
                <FieldError msg={touched ? workerError : undefined} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Passwort</Label>
                <Input
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="x"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-slate-500 text-xs">Bei den meisten Pools <code className="bg-slate-700 px-1 rounded">x</code></p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Summary */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">Bitte prüfe deine Eingaben. Du kannst zurückgehen um etwas zu korrigieren.</p>
            <Card className="bg-slate-900/50 border-slate-600">
              <CardContent className="p-4">
                <SummaryRow label="Name"       value={form.name} />
                <SummaryRow label="Pool-URL"   value={form.pool_url} />
                <SummaryRow label="Port"       value={form.pool_port} />
                <SummaryRow label="Workername" value={form.worker_name} />
                <SummaryRow label="Passwort"   value={form.password || 'x'} />
              </CardContent>
            </Card>
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Alles korrekt? Klicke auf Speichern um die Konfiguration anzulegen.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
          <Button
            type="button"
            variant="ghost"
            onClick={step === 0 ? onDone : back}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {step === 0 ? 'Abbrechen' : 'Zurück'}
          </Button>

          {step < 3 ? (
            <Button onClick={next} className="bg-orange-500 hover:bg-orange-600 text-white">
              Weiter <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
              {loading ? 'Speichern...' : <><Check className="w-4 h-4 mr-1.5" /> Speichern</>}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PoolConfigManager({ configs, userId }: { configs: PoolConfig[]; userId: string }) {
  const router = useRouter()
  const [showWizard, setShowWizard] = useState(false)

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('customer_pool_configs').delete().eq('id', id)
    if (error) toast.error('Fehler beim Löschen')
    else { toast.success('Konfiguration gelöscht'); router.refresh() }
  }

  async function handleSetDefault(id: string) {
    const supabase = createClient()
    await supabase.from('customer_pool_configs').update({ is_default: false }).eq('user_id', userId)
    await supabase.from('customer_pool_configs').update({ is_default: true }).eq('id', id)
    toast.success('Standard-Pool aktualisiert')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {!showWizard && (
        <Button
          onClick={() => setShowWizard(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Pool hinzufügen
        </Button>
      )}

      {configs.map(config => (
        <Card key={config.id} className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-700 rounded-lg mt-0.5">
                  <Server className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{config.name}</p>
                    {config.is_default && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Standard</Badge>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm font-mono mt-0.5">{config.pool_url}:{config.pool_port}</p>
                  <p className="text-slate-500 text-xs mt-0.5">Worker: {config.worker_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!config.is_default && (
                  <Button variant="ghost" size="sm" onClick={() => handleSetDefault(config.id)} className="text-slate-400 hover:text-orange-400">
                    <Star className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleDelete(config.id)} className="text-slate-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {showWizard && (
        <Wizard configs={configs} userId={userId} onDone={() => setShowWizard(false)} />
      )}
    </div>
  )
}
