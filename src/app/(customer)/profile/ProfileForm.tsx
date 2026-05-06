'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Lock, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ProfileForm({
  initialName,
  initialEmail,
  createdAt,
}: {
  initialName: string
  initialEmail: string
  createdAt: string
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)

  async function saveProfile() {
    if (!name.trim() && !email.trim()) return
    setLoadingProfile(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          ...(email !== initialEmail ? { email } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Profil aktualisiert')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLoadingProfile(false)
    }
  }

  async function savePassword() {
    if (!password) return
    if (password.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }
    if (password !== passwordConfirm) {
      toast.error('Passwörter stimmen nicht überein')
      return
    }
    setLoadingPassword(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Passwort geändert')
      setPassword('')
      setPasswordConfirm('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Account info */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <User className="w-4 h-4 text-orange-400" />
            Kontodaten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300">Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Dein Name"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> E-Mail
            </Label>
            <Input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          {createdAt && (
            <div className="flex items-center gap-2 text-slate-500 text-xs pt-1">
              <Calendar className="w-3.5 h-3.5" />
              Mitglied seit {new Date(createdAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          )}
          <Button
            onClick={saveProfile}
            disabled={loadingProfile}
            className="bg-orange-500 hover:bg-orange-600 text-white w-full"
          >
            {loadingProfile ? 'Speichern...' : 'Speichern'}
          </Button>
        </CardContent>
      </Card>

      {/* Password change */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-400" />
            Passwort ändern
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300">Neues Passwort</Label>
            <Input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              placeholder="Mind. 8 Zeichen"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Passwort bestätigen</Label>
            <Input
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              type="password"
              placeholder="Passwort wiederholen"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
            {passwordConfirm && password !== passwordConfirm && (
              <p className="text-red-400 text-xs">Passwörter stimmen nicht überein</p>
            )}
          </div>
          <Button
            onClick={savePassword}
            disabled={loadingPassword || !password || password !== passwordConfirm}
            className="bg-orange-500 hover:bg-orange-600 text-white w-full"
          >
            {loadingPassword ? 'Ändern...' : 'Passwort ändern'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
