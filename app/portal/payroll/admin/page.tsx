import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import PayrollDashboard from '@/components/payroll/PayrollDashboard';

export default async function PayrollAdminPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const { data: editors } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'editor');

  return <PayrollDashboard editors={editors || []} />;
}
