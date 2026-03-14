import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    const supabase = await createServerSupabaseClient();
    const session = await supabase.auth.getSession();

    if (!session?.data.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify requester is admin
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.data.session.user.id)
      .single();

    if (requesterProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Unassign all clips
    const { error: unassignError } = await supabase
      .from('clips')
      .update({ assigned_editor_id: null })
      .eq('assigned_editor_id', userId);

    if (unassignError) {
      console.error('Error unassigning clips:', unassignError);
    }

    // Delete portal access records
    const { error: accessError } = await supabase
      .from('portal_access')
      .delete()
      .eq('user_id', userId);

    if (accessError) {
      console.error('Error deleting portal access:', accessError);
    }

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      return NextResponse.json(
        { error: authError.message || 'Failed to delete auth user' },
        { status: 400 }
      );
    }

    // Profile will be auto-deleted by CASCADE constraint
    return NextResponse.json(
      { message: 'Editor deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Remove editor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
