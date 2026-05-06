import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSupportMail } from '@/lib/email'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject, message } = await request.json()
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Betreff und Nachricht sind erforderlich' }, { status: 400 })
  }

  try {
    await sendSupportMail({ fromEmail: user.email!, subject, message })
  } catch {
    return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}
