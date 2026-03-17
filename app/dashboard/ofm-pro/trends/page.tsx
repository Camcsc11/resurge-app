import { createServerSupabaseClient } from '@/lib/supabase/server';
import TrendsGrid from '@/components/ofm-pro/TrendsGrid';

export default async function TrendsPage() {
  const supabase = createServerSupabaseClient();
  const { data: reels } = await supabase
    .from('ofm_reels')
    .select('id, title, source_url, description, thumbnail_url, status, platform, created_at, views, likes, shares, comments_count, creator_handle, shortcode, posted_at_text')
    .not('source_url', 'is', null)
    .neq('source_url', '')
    .eq('status', 'approved')
    .order('views', { ascending: false });

  return <TrendsGrid initialReels={reels || []} />;
}
