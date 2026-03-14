import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import EmployeeScheduleView from '@/components/scheduling/EmployeeScheduleView';

export default async function EmployeeSchedulePage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (!profile) redirect('/login');

  return <EmployeeScheduleView userId={session.user.id} />;
}
