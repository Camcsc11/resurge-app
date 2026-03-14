import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FinishedClipsTable } from '@/components/dashboard/cd/FinishedClipsTable';

export default async function CDFinishedPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  // Fetch profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'cd') redirect('/dashboard');

  // Fetch finished clips with joins
  const { data: finishedClips } = await supabase
    .from('finished_clips')
    .select('*, clip:clips(*), editor:profiles!editor_id(*)');

  // Fetch tags
  const { data: tags } = await supabase
    .from('tags')
    .select('*');

  return (
    <FinishedClipsTable
      finishedClips={finishedClips || []}
      tags={tags || []}
    />
  );
}
