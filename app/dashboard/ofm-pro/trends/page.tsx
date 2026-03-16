import { createServerSupabaseClient } from '@/lib/supabase/server';
import ReelViewer from '@/components/ofm-pro/ReelViewer';

export default async function TrendsPage() {
  const supabase = createServerSupabaseClient();

  try {
    const { data: reels, error } = await supabase
      .from('ofm_reels')
      .select(
        'id, title, source_url, description, thumbnail_url, status, platform, created_at'
      )
      .not('source_url', 'is', null)
      .neq('source_url', '')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return <ReelViewer initialReels={reels || []} />;
  } catch (error) {
    console.error('Failed to fetch reels for viewer:', error);
    return (
      <div className="p-8 text-center text-red-400">
        Failed to load reels. Please try again.
      </div>
    );
  }
}
