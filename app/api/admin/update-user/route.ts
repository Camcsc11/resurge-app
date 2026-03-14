import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, password, fullName, role } = body;

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

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update auth user if email or password changed
    if (email || password) {
      const updateData: any = {};
      if (email) updateData.email = email;
      if (password) updateData.password = password;

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);

      if (authError) {
        return NextResponse.json(
          { error: authError.message || 'Failed to update auth user' },
          { status: 400 }
        );
      }
    }

    // Update profile if fullName or role changed
    if (fullName || role) {
      const profileUpdate: any = {};
      if (fullName) profileUpdate.full_name = fullName;
      if (role) profileUpdate.role = role;

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId);

      if (profileError) {
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }
    }

    // Fetch updated profile
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return NextResponse.json(
      {
        user: {
          id: userId,
          email: email || updatedProfile?.email,
          fullName: fullName || updatedProfile?.full_name,
          role: role || updatedProfile?.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
