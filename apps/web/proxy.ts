import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Proxy (Middleware)
 * 
 * Lightweight session gate: Uses edge-native cookie verification to avoid bundling
 * heavy server-side auth dependencies (OpenTelemetry, ua-parser, and crypto parsers).
 * Full cryptographic validation is executed safely inside server components and route handlers.
 */
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Canonical redirect: normalize legacy /dashboard and alias paths to canonical routes
  if (pathname === '/onboarding/upload' || pathname.startsWith('/onboarding/upload/')) {
    const url = req.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }
  if (pathname === '/edit-experience' || pathname.startsWith('/edit-experience/')) {
    const url = req.nextUrl.clone();
    url.pathname = '/experience';
    return NextResponse.redirect(url);
  }
  if (pathname === '/dashboard') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith('/dashboard/')) {
    const url = req.nextUrl.clone();
    const normalized = pathname.replace(/^\/dashboard/, '');
    url.pathname = normalized.startsWith('/edit-experience') ? '/experience' : normalized;
    return NextResponse.redirect(url);
  }

  // 2. Check for session cookies (production or dev prefix)
  const sessionToken =
    req.cookies.get('__Secure-authjs.session-token')?.value ||
    req.cookies.get('authjs.session-token')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value;

  const isLoggedIn = !!sessionToken;

  // 3. Protected internal routes that require authentication
  // Note: '/' is public at proxy level because unauthenticated visitors view the Landing page,
  // and authenticated users view the Dashboard (handled dynamically inside app/page.tsx).
  const isProtectedRoute =
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/track') ||
    pathname.startsWith('/experience');

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. If user is already authenticated and visits login or signup page, redirect to home (/)
  if (isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/...)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public static files: .svg, .png, .jpg, .jpeg, .gif, .webp, .ico, .woff, .woff2, .txt
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|txt)$).*)',
  ],
};
