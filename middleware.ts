import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { decrypt } from '@/lib/auth';

const COOKIE_NAME = 'yillik_foto_session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path === '/login' || path.startsWith('/api/auth');

  // Skip middleware for static files, public images, generic Next.js requests
  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon.ico') ||
    path.startsWith('/uploads')
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get(COOKIE_NAME)?.value;
  let sessionData = null;

  if (session) {
    try {
      sessionData = await decrypt(session);
    } catch {
      // Invalid session cookie (likely stale), clear it
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  if (!isPublicPath && !sessionData) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicPath && sessionData) {
    // If user is already logged in and tries to access /login, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
