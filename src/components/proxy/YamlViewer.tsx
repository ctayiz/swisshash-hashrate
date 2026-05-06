'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export function YamlViewer({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('YAML kopiert')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCopy}
        className="absolute top-3 right-3 text-slate-400 hover:text-white z-10"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
      <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm text-green-400 font-mono overflow-auto max-h-[600px] whitespace-pre leading-relaxed">
        {content}
      </pre>
    </div>
  )
}
