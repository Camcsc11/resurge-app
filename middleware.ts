import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

const secret = new TextEncoder().encode(
  process.env.CREATOR_JWT_SECRET || 'default-secret-key'
);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/creator-portal')) {
    const token = request.cookies.get('creator_session')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/creator-login', request.url));
    }

    try {
      await jose.jwtVerify(token, secret);
    } catch (error) {
      const response = NextResponse.redirect(
        new URL('/creator-login', request.url)
      );
      response.cookies.delete('creator_session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/creator-portal/:path*', '/api/creator-reels/:path*', '/api/creator-upload/:path*'],
};
