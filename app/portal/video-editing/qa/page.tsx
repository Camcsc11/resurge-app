import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import QADashboard from '@/components/dashboard/QADashboard';

export default async function QAPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (!profile || profile.role !== 'qa') redirect('/login');

  const { data: clips } = await supabase
    .from('clips')
    .select('*')
    .order('created_at', { ascending: false });

  return <QADashboard clips={clips || []} />;
}
