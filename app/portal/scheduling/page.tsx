import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function SchedulingPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (!profile) redirect('/login');

  const redirectPath = profile.role === 'admin' ? '/portal/scheduling/admin' : '/portal/scheduling/employee';
  redirect(redirectPath);
}
