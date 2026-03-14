import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import QADashboard from '@/components/qa/QADashboard';

export default async function QAPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  // Fetch profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'qa') redirect('/dashboard');

  // Fetch pending submissions for QA review
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, clip:clips(*), editor:profiles!editor_id(*)')
    .eq('status', 'pending_qa');

  return (
    <QADashboard
      submissions={submissions || []}
      profile={profile}
    />
  );
}
