import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import QAReviewHistoryTable from '@/components/qa/QAReviewHistoryTable';

export default async function QAHistoryPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  // Fetch profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'qa') redirect('/dashboard');

  // Fetch all reviews by this QA reviewer
  const { data: qaReviews } = await supabase
    .from('qa_reviews')
    .select('*, submission:submissions(*, clip:clips(*))')
    .eq('reviewer_id', session.user.id)
    .order('reviewed_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Review History</h1>
        <p className="text-gray-600 mt-2">
          View all of your completed QA reviews
        </p>
      </div>

      <QAReviewHistoryTable qaReviews={qaReviews || []} />
    </div>
  );
}
