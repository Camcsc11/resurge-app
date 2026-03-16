import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source_url, title, creator_handle, platform, description } = body;

    if (!source_url) {
      return NextResponse.json({ error: 'source_url is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('ofm_reels')
      .insert({
        source_url,
        title: title || 'Untitled Reel',
        creator_handle: creator_handle || 'anonymous',
        platform: platform || 'instagram',
        description: description || '',
        thumbnail_url: '',
        status: 'approved',
        views: 0,
        likes: 0,
        shares: 0,
        comments_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reel: data });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
