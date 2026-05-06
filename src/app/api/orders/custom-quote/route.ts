import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendCustomQuoteRequest } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { hashrate_th, duration_days, message } = await request.json()

    if (!hashrate_th || !duration_days) {
      return NextResponse.json({ error: 'Hashrate und Laufzeit sind pflicht' }, { status: 400 })
    }

    await sendCustomQuoteRequest({
      customerEmail: user.email!,
      hashrate_th: Number(hashrate_th),
      duration_days: Number(duration_days),
      message: message ?? '',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 500 })
  }
}
