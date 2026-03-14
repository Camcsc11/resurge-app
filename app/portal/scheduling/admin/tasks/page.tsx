import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import AdminTaskManagement from '@/components/scheduling/AdminTaskManagement';

export default async function AdminTasksPage() {
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

  return <AdminTaskManagement employees={employees || []} />;
}
