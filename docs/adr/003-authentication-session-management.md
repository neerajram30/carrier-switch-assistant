# ADR 003: User Session Management with NextAuth & JWT

## Status

Confirmed

## Context

Career Switch Assistant requires secure, standards-compliant session management across its Next.js frontend web application and NestJS backend API. Users authenticate via email/password credentials or OAuth providers (Google, GitHub). Protected routes must reject unauthenticated requests and maintain session state across client navigations.

## Decision

Adopt NextAuth (Auth.js v5) with a JWT session strategy for the web client, backed by signed JWT tokens and secure HTTP cookies:

1. **Session Strategy:**
   - Use `strategy: 'jwt'` with an explicit 30-day session maximum age (`maxAge: 30 * 24 * 60 * 60`).
   - Store session tokens in encrypted, signed cookies with `httpOnly: true`, `sameSite: 'lax'`, and `secure: process.env.NODE_ENV === 'production'`.

2. **Decoupled Architecture (`auth.config.ts` & `auth.ts`):**
   - Place pure authentication configuration, provider definitions, and callbacks in [auth.config.ts](file:///c:/Users/asus/OneDrive/Desktop/Projects/carrier-switch-assistant/apps/web/auth.config.ts) for compatibility with Edge middleware, unit test environments, and client imports.
   - Initialize the NextAuth handlers in [auth.ts](file:///c:/Users/asus/OneDrive/Desktop/Projects/carrier-switch-assistant/apps/web/auth.ts).

3. **Backend API Token Synchronization:**
   - On valid credential submission, NextAuth's `authorize` handler verifies credentials against the NestJS API (`/api/v1/auth/login`).
   - The returned `accessToken` is embedded into the NextAuth JWT token and session user object (`session.user.apiToken`), enabling authorized API communication via `Authorization: Bearer <token>`.

4. **Route Protection & Security Enforcement:**
   - Next.js middleware guards protected routes (`/dashboard`, `/onboarding`, `/explore`, `/track`, `/experience`, `/edit-experience`), redirecting unauthenticated users to `/` with the original `callbackUrl`.
   - Credentials input validation checks email format and sanitizes parameters before any API communication.
   - Session termination (`signOut`) cleanly clears client storage and invalidates the session cookie.

## Consequences

- Secure, cross-site scripting (XSS)-resilient cookie management with `httpOnly` flags.
- Consistent user session across page reloads and client-side transitions via `<SessionProvider>`.
- Full compatibility with existing NestJS `AuthGuard` and `HybridAuthUserProvider`.
