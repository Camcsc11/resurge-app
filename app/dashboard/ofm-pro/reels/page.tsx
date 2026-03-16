import { createServerSupabaseClient } from '@/lib/supabase/server';
import ReelsClient from '@/components/ofm-pro/ReelsClient';

interface Reel {
  id: string;
  title: string;
  source_url: string;
  description: string;
  thumbnail_url: string;
  status: string;
  priority: string;
  due_date: string;
  admin_notes: string;
  creator_id: string;
  assigned_creator: {
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
  submission_data: any;
  creator_notes: string;
}

export default async function ReelsPage() {
  const supabase = createServerSupabaseClient();

  try {
    const { data: reels, error } = await supabase
      .from('ofm_reels')
      .select(
        `
        id,
        title,
        source_url,
        description,
        thumbnail_url,
        status,
        priority,
        due_date,
        admin_notes,
        creator_id,
        created_at,
        updated_at,
        submission_data,
        creator_notes,
        assigned_creator:creator_id(name)
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;

    return <ReelsClient initialReels={reels || []} />;
  } catch (error) {
    console.error('Failed to fetch reels:', error);
    return (
      <div className="p-8 text-center text-red-400">
        Failed to load reels. Please try again.
      </div>
    );
  }
}
