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

  // Check for session cookies (production or dev prefix)
  const sessionToken =
    req.cookies.get('__Secure-authjs.session-token')?.value ||
    req.cookies.get('authjs.session-token')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value;

  const isLoggedIn = !!sessionToken;

  // Protected internal routes that require authentication
  const isProtectedRoute =
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/track') ||
    pathname.startsWith('/experience') ||
    pathname.startsWith('/edit-experience');

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If user is already authenticated and visits login or signup page, redirect to dashboard (/)
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
