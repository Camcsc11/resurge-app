import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CDDashboard } from '@/components/dashboard/cd/CDDashboard';

export default async function CDPage() {
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

  // Fetch all clips with assigned editor
  const { data: clips } = await supabase
    .from('clips')
    .select('*, assigned_editor:profiles!assigned_editor_id(*)');

  // Fetch all editors
  const { data: editors } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'editor');

  return (
    <CDDashboard
      clips={clips || []}
      editors={editors || []}
      profile={profile}
    />
  );
}
