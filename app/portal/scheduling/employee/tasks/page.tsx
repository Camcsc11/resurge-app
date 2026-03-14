import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import EmployeeTaskView from '@/components/scheduling/EmployeeTaskView';

export default async function EmployeeTasksPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (!profile) redirect('/login');

  return <EmployeeTaskView userId={session.user.id} />;
}
