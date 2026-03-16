import { cookies } from 'next/headers';
import { verifyCreatorToken } from '@/lib/creator-auth';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import CreatorPortalDashboard from '@/components/ofm-pro/CreatorPortalDashboard';

interface ReelStats {
  pending: number;
  in_progress: number;
  completed: number;
}

interface Reel {
  id: string;
  title: string;
  description: string;
  source_url: string;
  status: string;
  priority: string;
  due_date: string;
  admin_notes: string;
  creator_notes: string;
  submission_data: any;
}

async function getCreatorReels(creatorId: string): Promise<{
  reels: Reel[];
  stats: ReelStats;
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const { data: reels, error } = await supabase
    .from('ofm_reels')
    .select('*')
    .eq('creator_id', creatorId)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Failed to fetch reels:', error);
    return { reels: [], stats: { pending: 0, in_progress: 0, completed: 0 } };
  }

  const stats = (reels || []).reduce(
    (acc, reel) => {
      if (reel.status === 'assigned') acc.pending++;
      if (reel.status === 'in_progress') acc.in_progress++;
      if (reel.status === 'approved') acc.completed++;
      return acc;
    },
    { pending: 0, in_progress: 0, completed: 0 }
  );

  return { reels: reels || [], stats };
}

export default async function CreatorPortalPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('creator_session')?.value;

  if (!token) {
    redirect('/creator-login');
  }

  const payload = await verifyCreatorToken(token);
  if (!payload) {
    redirect('/creator-login');
  }

  const { reels, stats } = await getCreatorReels(payload.creator_id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1a2332] rounded-lg border border-[#2a3a4a] p-6">
            <div className="text-gray-400 text-sm font-medium mb-2">
              Pending Assignment
            </div>
            <div className="text-3xl font-bold text-white">{stats.pending}</div>
          </div>

          <div className="bg-[#1a2332] rounded-lg border border-[#2a3a4a] p-6">
            <div className="text-gray-400 text-sm font-medium mb-2">
              In Progress
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.in_progress}
            </div>
          </div>

          <div className="bg-[#1a2332] rounded-lg border border-[#2a3a4a] p-6">
            <div className="text-gray-400 text-sm font-medium mb-2">
              Completed
            </div>
            <div className="text-3xl font-bold text-green-400">
              {stats.completed}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Assigned Reels</h2>
        <CreatorPortalDashboard initialReels={reels} creatorId={payload.creator_id} />
      </div>
    </div>
  );
}
