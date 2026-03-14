import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import AdminScheduleView from '@/components/scheduling/AdminScheduleView';

export default async function AdminSchedulePage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const { data: employees } = await supabase
    .from('profiles')
    .select('*')
    .neq('role', 'admin');

  return <AdminScheduleView employees={employees || []} />;
}
