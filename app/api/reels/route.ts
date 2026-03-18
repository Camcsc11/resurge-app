import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function parseCount(value: string | number): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const str = value.trim().toUpperCase();
  const numMatch = str.match(/^([\d.]+)([KMB])?$/);
  if (!numMatch) return 0;
  const num = parseFloat(numMatch[1]);
  const suffix = numMatch[2];
  switch (suffix) {
    case 'K': return Math.round(num * 1000);
    case 'M': return Math.round(num * 1000000);
    case 'B': return Math.round(num * 1000000000);
    default: return Math.round(num);
  }
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('ofm_reels')
      .select('*, ofm_creators(id, name)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reels: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source_url, title, creator_handle, platform, description, assigned_to } = body;

    if (!source_url) {
      return NextResponse.json({ error: 'source_url is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const reelData: any = {
      source_url,
      title: title || 'Untitled Reel',
      creator_handle: creator_handle || 'anonymous',
      platform: platform || 'instagram',
      description: description || '',
      thumbnail_url: '',
      status: assigned_to ? 'assigned' : 'approved',
      views: 0,
      likes: 0,
      shares: 0,
      comments_count: 0,
    };

    if (assigned_to) {
      reelData.assigned_to = assigned_to;
      reelData.assigned_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('ofm_reels')
      .insert(reelData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If assigned, also create a content_assignment record
    if (assigned_to) {
      await supabase
        .from('content_assignments')
        .insert({
          reel_id: data.id,
          model_id: assigned_to,
          status: 'pending',
        });
    }

    return NextResponse.json({ reel: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from('ofm_reels')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { reels } = body;

    if (!Array.isArray(reels)) {
      return NextResponse.json({ error: 'reels must be an array' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error: deleteError } = await supabase
      .from('ofm_reels')
      .delete()
      .eq('status', 'approved');

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const parsedReels = reels.map((reel) => ({
      shortcode: reel.shortcode || '',
      source_url: reel.source_url || '',
      creator_handle: reel.creator_handle || 'anonymous',
      platform: reel.platform || 'instagram',
      posted_at_text: reel.posted_at_text || '',
      shares: parseCount(reel.shares),
      views: parseCount(reel.views),
      likes: parseCount(reel.likes),
      comments_count: parseCount(reel.comments_count),
      status: 'approved',
      title: `Reel by ${reel.creator_handle}`,
      description: '',
      thumbnail_url: '',
    }));

    const { data, error: insertError } = await supabase
      .from('ofm_reels')
      .insert(parsedReels)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      reels: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
