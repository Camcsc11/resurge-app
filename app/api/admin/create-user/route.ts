import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, role } = body;

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

    // Create auth user with email confirmation
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authUser) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create auth user' },
        { status: 400 }
      );
    }

    // Profile will be auto-created by DB trigger
    // But verify it exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (profileError) {
      // Try to manually create profile if trigger didn't work
      const { error: manualError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email,
          full_name: fullName,
          role,
        });

      if (manualError) {
        console.error('Error creating profile:', manualError);
      }
    } else if (profile && (profile.full_name !== fullName || profile.role !== role)) {
      // Update profile if needed
      await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          role,
        })
        .eq('id', authUser.user.id);
    }

    return NextResponse.json(
      {
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          fullName,
          role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
