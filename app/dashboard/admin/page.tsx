import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard/employee-home')
  }

  // Fetch all clips with editor/creator information
  const { data: clips } = await supabase
    .from('clips')
    .select('*, editor:profiles!editor_id(id, display_name), creator:profiles!creator_id(id, display_name)')
    .order('created_at', { ascending: false })

  // Fetch all editors
  const { data: editors } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'editor')
    .order('display_name')

  return (
    <AdminDashboard
      clips={clips || []}
      editors={editors || []}
      profile={profile}
    />
  )
}
