import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import EditorDashboard from '@/components/editor/EditorDashboard';

export default async function EditorPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  // Fetch profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'editor') redirect('/dashboard');

  // Fetch clips assigned to this editor
  const { data: clips } = await supabase
    .from('clips')
    .select('*')
    .eq('assigned_editor_id', session.user.id)
    .neq('status', 'finished');

  // Fetch submissions for these clips
  const clipIds = clips?.map((clip) => clip.id) || [];
  const { data: submissions } = clipIds.length > 0
    ? await supabase
        .from('submissions')
        .select('*')
        .in('clip_id', clipIds)
    : { data: [] };

  return (
    <EditorDashboard
      clips={clips || []}
      profile={profile}
      submissions={submissions || []}
    />
  );
}
