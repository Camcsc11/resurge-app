import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyCreatorToken } from '@/lib/creator-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('creator_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyCreatorToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: reels, error } = await supabase
      .from('ofm_reels')
      .select('*')
      .eq('creator_id', payload.creator_id)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ reels }, { status: 200 });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reels' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('creator_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyCreatorToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reel_id, status } = await request.json();

    if (!reel_id || !status) {
      return NextResponse.json(
        { error: 'Reel ID and status required' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('ofm_reels')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reel_id)
      .eq('creator_id', payload.creator_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(
      { success: true, message: 'Status updated' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update reel' },
      { status: 500 }
    );
  }
}
