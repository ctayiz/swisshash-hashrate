'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export function RebuildButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRebuild() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/proxy/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Rebuild fehlgeschlagen')
      }

      const result = await res.json()
      toast.success(`YAML v${result.version} generiert — ${result.active_order_count} aktive Orders`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Rebuild')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleRebuild}
      disabled={loading}
      className="bg-orange-500 hover:bg-orange-600 text-white"
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Generiere...' : 'Neu generieren'}
    </Button>
  )
}
