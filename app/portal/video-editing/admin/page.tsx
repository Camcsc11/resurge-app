import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const { data: clips } = await supabase
    .from('clips')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: editors } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'editor');

  return <AdminDashboard clips={clips || []} editors={editors || []} />;
}
