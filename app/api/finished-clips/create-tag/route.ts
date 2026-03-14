import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#E11D48', // Rose
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const session = await supabase.auth.getSession();

    if (!session?.data.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get count of existing tags to determine color index
    const { count: tagCount, error: countError } = await supabase
      .from('tags')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to get tag count' },
        { status: 500 }
      );
    }

    // Auto-assign color based on tag count
    const colorIndex = (tagCount || 0) % COLORS.length;
    const color = COLORS[colorIndex];

    // Insert new tag
    const { data: newTag, error: insertError } = await supabase
      .from('tags')
      .insert({
        name,
        color,
      })
      .select()
      .single();

    if (insertError || !newTag) {
      return NextResponse.json(
        { error: 'Failed to create tag' },
        { status: 500 }
      );
    }

    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error('Create tag error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
