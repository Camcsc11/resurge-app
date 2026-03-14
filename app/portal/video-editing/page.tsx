import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function VideoEditingPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (!profile) redirect('/login');

  const roleRedirects: Record<string, string> = {
    admin: '/portal/video-editing/admin',
    creative_director: '/portal/video-editing/cd',
    editor: '/portal/video-editing/editor',
    qa: '/portal/video-editing/qa',
  };

  const redirectPath = roleRedirects[profile.role] || '/login';
  redirect(redirectPath);
}
