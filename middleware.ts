import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession, getSession } from '@/lib/auth';

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

  const session = request.cookies.get('yillik_foto_session')?.value;
  let user = null;

  if (session) {
    try {
      // Dynamic imports or crypto functionality issues inside edge may occur, but `jose` usually works well.
      user = await updateSession(request);
      // Wait, updateSession returns a response header update if we wanted to update it.
      // But we just need to verify it. We can just check existence.
    } catch (e) {
      console.error(e);
      // Token expired or invalid
      user = null;
    }
  }

  if (!isPublicPath && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicPath && session) {
    // If user is already logged in and tries to access /login, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
