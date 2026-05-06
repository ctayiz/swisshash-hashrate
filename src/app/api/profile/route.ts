import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { full_name, email, password } = await request.json()
  const admin = createAdminClient()

  // Update display name in profiles table
  if (full_name !== undefined) {
    const { error } = await admin
      .from('profiles')
      .update({ full_name: full_name.trim() || null })
      .eq('id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update email or password via Supabase Auth Admin API
  if (email || password) {
    const updates: { email?: string; password?: string } = {}
    if (email) updates.email = email.trim()
    if (password) updates.password = password

    const { error } = await admin.auth.admin.updateUserById(user.id, updates)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
