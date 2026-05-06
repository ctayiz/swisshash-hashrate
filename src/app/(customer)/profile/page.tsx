import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email, created_at')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Profil</h1>
        <p className="text-slate-400 mt-1">Kontodaten verwalten</p>
      </div>
      <ProfileForm
        initialName={profile?.full_name ?? ''}
        initialEmail={profile?.email ?? user.email ?? ''}
        createdAt={profile?.created_at ?? ''}
      />
    </div>
  )
}
