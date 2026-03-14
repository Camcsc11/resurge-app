import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import CDFinished from '@/components/cd/CDFinished';

export default async function CDFinishedPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (!profile || profile.role !== 'creative_director') redirect('/login');

  const { data: clips } = await supabase
    .from('clips')
    .select('*')
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  return <CDFinished clips={clips || []} />;
}
