import { NextResponse } from 'next/server'
import { generateAndSaveProxyConfig } from '@/lib/proxy/generator'
import type { TriggerSource } from '@/types/domain'

export async function POST(request: Request) {
  // Secured by REBUILD_SECRET — validated in middleware
  try {
    const body = await request.json().catch(() => ({}))
    const triggerSource: TriggerSource = body.trigger_source ?? 'manual'
    const triggerOrderId: string | undefined = body.trigger_order_id
    const generatedBy: string | undefined = body.generated_by

    const result = await generateAndSaveProxyConfig(triggerSource, triggerOrderId, generatedBy)

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[proxy/rebuild]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
