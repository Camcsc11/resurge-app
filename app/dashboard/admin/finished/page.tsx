import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import FinishedClipsTable from '@/components/cd/FinishedClipsTable'

export default async function FinishedPage() {
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

  // Fetch finished clips (approved status) with joined data
  const { data: finishedClips } = await supabase
    .from('clips')
    .select(
      '*, editor:profiles!editor_id(id, display_name, email), creator:profiles!creator_id(id, display_name, email)'
    )
    .eq('status', 'approved')
    .order('completed_at', { ascending: false })

  return (
    <FinishedClipsTable clips={finishedClips || []} />
  )
}
