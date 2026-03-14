import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import FinishedClipsTable from '@/components/cd/FinishedClipsTable'

export default async function FinishedPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: clips } = await supabase
    .from('clips')
    .select('*')
    .eq('status', 'approved')
    .order('updated_at', { ascending: false })

  const { data: tags } = await supabase
    .from('tags')
    .select('*')

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Finished Clips</h1>
        <FinishedClipsTable
          finishedClips={clips || []}
          tags={tags || []}
          isAdmin={true}
        />
      </div>
    </div>
  )
}
