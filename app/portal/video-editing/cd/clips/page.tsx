import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import CDClips from '@/components/cd/CDClips';

export default async function CDClipsPage() {
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
    .order('created_at', { ascending: false });

  return <CDClips clips={clips || []} />;
}
