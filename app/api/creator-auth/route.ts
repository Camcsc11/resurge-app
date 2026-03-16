import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signCreatorToken } from '@/lib/creator-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { username, access_code } = await request.json();

    if (!username || !access_code) {
      return NextResponse.json(
        { error: 'Username and access code required' },
        { status: 400 }
      );
    }

    const { data: account, error } = await supabase
      .from('ofm_creator_accounts')
      .select('id, creator_id, username')
      .eq('username', username)
      .eq('access_code', access_code)
      .single();

    if (error || !account) {
      return NextResponse.json(
        { error: 'Invalid username or access code' },
        { status: 401 }
      );
    }

    const token = await signCreatorToken({
      creator_id: account.creator_id,
      username: account.username,
    });

    const response = NextResponse.json(
      { success: true, message: 'Login successful' },
      { status: 200 }
    );

    response.cookies.set('creator_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Creator auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
