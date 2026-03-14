import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import AdminFinished from '@/components/admin/AdminFinished';

export default async function AdminFinishedPage() {
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
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  return <AdminFinished clips={clips || []} />;
}
