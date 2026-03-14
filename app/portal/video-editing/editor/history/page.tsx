import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import EditorHistory from '@/components/dashboard/EditorHistory';

export default async function EditorHistoryPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (!profile || profile.role !== 'editor') redirect('/login');

  const { data: clips } = await supabase
    .from('clips')
    .select('*')
    .eq('assigned_to', session.user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  return <EditorHistory clips={clips || []} />;
}
