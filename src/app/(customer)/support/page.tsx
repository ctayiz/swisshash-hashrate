'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LifeBuoy, Send, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SupportPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSent(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Senden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Support</h1>
        <p className="text-slate-400 mt-1">Wir helfen dir gerne weiter</p>
      </div>

      {sent ? (
        <Card className="bg-slate-800/50 border-green-500/30">
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-green-400" />
            </div>
            <div>
              <p className="text-white text-lg font-semibold">Nachricht gesendet</p>
              <p className="text-slate-400 text-sm mt-1">
                Wir haben deine Anfrage erhalten und melden uns so schnell wie möglich.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 mt-2"
              onClick={() => { setSent(false); setSubject(''); setMessage('') }}
            >
              Neue Anfrage
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-orange-400" />
              Support-Ticket erstellen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Betreff <span className="text-red-400">*</span></Label>
                <Input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Kurze Beschreibung deines Anliegens"
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Nachricht <span className="text-red-400">*</span></Label>
                <Textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Beschreibe dein Anliegen so detailliert wie möglich..."
                  required
                  rows={6}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-slate-500 text-xs">
                  Antwort an: <span className="text-slate-400">ticket@swisshash.com</span>
                </p>
                <Button
                  type="submit"
                  disabled={loading || !subject.trim() || !message.trim()}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {loading ? 'Senden...' : <><Send className="w-4 h-4 mr-2" />Senden</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
