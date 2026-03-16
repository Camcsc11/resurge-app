import { createServerSupabaseClient } from '@/lib/supabase/server';
import TrendsGrid from '@/components/ofm-pro/TrendsGrid';

export default async function TrendsPage() {
  const supabase = createServerSupabaseClient();
  const { data: reels } = await supabase
    .from('ofm_reels')
    .select('id, title, source_url, description, thumbnail_url, status, platform, created_at, views, likes, shares, comments_count, creator_handle')
    .not('source_url', 'is', null)
    .neq('source_url', '')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  return <TrendsGrid initialReels={reels || []} />;
}
