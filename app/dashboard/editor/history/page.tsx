import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import SubmissionHistoryTable from '@/components/editor/SubmissionHistoryTable';

export default async function EditorHistoryPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  // Fetch profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'editor') redirect('/dashboard');

  // Fetch all submissions by this editor
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, clip:clips(*)')
    .eq('editor_id', session.user.id)
    .order('submitted_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Submission History</h1>
        <p className="text-gray-600 mt-2">
          View all of your submitted work and review status
        </p>
      </div>

      <SubmissionHistoryTable submissions={submissions || []} />
    </div>
  );
}
