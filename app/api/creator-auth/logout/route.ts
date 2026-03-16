import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    { success: true, message: 'Logged out' },
    { status: 200 }
  );

  response.cookies.delete('creator_session');

  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL('/creator-login', request.url)
  );

  response.cookies.delete('creator_session');

  return response;
}
