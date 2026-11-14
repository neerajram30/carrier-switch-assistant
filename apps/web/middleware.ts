import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Protected internal routes
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/track') ||
    pathname.startsWith('/experience') ||
    pathname.startsWith('/edit-experience');

  if (isProtectedRoute && !isLoggedIn) {
    // In production, enforce authentication strictly; in dev, allow seamless local development
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      const loginUrl = new URL('/', req.nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
