'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export function PackageToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(isActive)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    const newValue = !active

    const { error } = await supabase.from('packages').update({ is_active: newValue }).eq('id', id)

    if (error) {
      toast.error('Fehler beim Aktualisieren')
    } else {
      setActive(newValue)
      toast.success(newValue ? 'Paket aktiviert' : 'Paket deaktiviert')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading} className="text-left">
      <Badge
        className={
          active
            ? 'bg-green-500/20 text-green-400 border-green-500/30 cursor-pointer hover:bg-green-500/30'
            : 'bg-slate-700 text-slate-400 border-slate-600 cursor-pointer hover:bg-slate-600'
        }
      >
        {loading ? '...' : active ? 'Aktiv' : 'Inaktiv'}
      </Badge>
    </button>
  )
}
