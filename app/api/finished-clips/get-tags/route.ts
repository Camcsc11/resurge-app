import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const session = await supabase.auth.getSession();

    if (!session?.data.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query all tags
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .order('created_at', { ascending: true });

    if (tagsError) {
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      );
    }

    return NextResponse.json(tags || [], { status: 200 });
  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
