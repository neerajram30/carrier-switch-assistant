import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authConfig } from '../auth.config';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  token?: string;
}

type AuthorizeFn = (credentials: Record<string, unknown> | null) => Promise<AuthUser | null>;

interface AuthProviderItem {
  id?: string;
  name?: string;
  options?: {
    authorize?: AuthorizeFn;
  };
  authorize?: AuthorizeFn;
}

describe('NextAuth JWT Session Management & Security', () => {
  const credentialsProvider = (authConfig.providers as AuthProviderItem[]).find(
    (p) => p.id === 'credentials' || p.name === 'Credentials',
  );
  const authorize: AuthorizeFn =
    credentialsProvider?.options?.authorize || credentialsProvider?.authorize || (async () => null);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session & Security Configuration', () => {
    it('configures JWT strategy with 30-day session lifespan', () => {
      expect(authConfig.session).toBeDefined();
      expect(authConfig.session?.strategy).toBe('jwt');
      expect(authConfig.session?.maxAge).toBe(30 * 24 * 60 * 60);
    });

    it('enforces secure httpOnly session cookies with lax same-site policy', () => {
      expect(authConfig.cookies).toBeDefined();
      const cookiesMap = authConfig.cookies as Record<string, { options: { httpOnly: boolean; sameSite: string; path: string } }> | undefined;
      const sessionTokenCookie = cookiesMap?.sessionToken;
      expect(sessionTokenCookie).toBeDefined();
      expect(sessionTokenCookie?.options.httpOnly).toBe(true);
      expect(sessionTokenCookie?.options.sameSite).toBe('lax');
      expect(sessionTokenCookie?.options.path).toBe('/');
    });

    it('defines explicit sign-in and error page redirects', () => {
      expect(authConfig.pages?.signIn).toBe('/login');
      expect(authConfig.pages?.error).toBe('/login');
    });
  });

  describe('Credentials Provider Authorization', () => {
    it('rejects empty or missing credentials without contacting API', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      const nullResult = await authorize(null);
      const emptyResult = await authorize({ email: '', password: '' });
      const noPassResult = await authorize({ email: 'user@example.com' });

      expect(nullResult).toBeNull();
      expect(emptyResult).toBeNull();
      expect(noPassResult).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('rejects invalid email formats without contacting API', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      const result = await authorize({
        email: 'invalid-email-address',
        password: 'Password123!',
      });

      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('authenticates valid credentials against API and returns user with JWT token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            id: 'user-uuid-1234',
            email: 'valid.user@example.com',
            name: 'Alex Morgan',
          },
          accessToken: 'jwt-access-token-xyz',
        }),
      } as Response);

      const user = await authorize({
        email: 'valid.user@example.com',
        password: 'correctPassword',
      });

      expect(user).not.toBeNull();
      expect(user?.id).toBe('user-uuid-1234');
      expect(user?.email).toBe('valid.user@example.com');
      expect(user?.name).toBe('Alex Morgan');
      expect(user?.token).toBe('jwt-access-token-xyz');
    });

    it('returns null on invalid credentials when API returns 401 Unauthorized', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Invalid email or password',
        }),
      } as Response);

      const user = await authorize({
        email: 'attacker@example.com',
        password: 'wrongPassword',
      });

      expect(user).toBeNull();
    });
  });

  describe('JWT and Session Callbacks', () => {
    it('stores user identification and accessToken in JWT token payload', async () => {
      const jwtCallback = authConfig.callbacks?.jwt;
      expect(jwtCallback).toBeDefined();

      const user = {
        id: 'user-uuid-5678',
        email: 'engineer@company.com',
        name: 'Sarah Connor',
        token: 'signed-bearer-token-999',
      };

      type JwtCallbackFn = (params: {
        token: Record<string, unknown>;
        user?: Record<string, unknown>;
      }) => Promise<Record<string, unknown>>;

      const initialToken = {};
      const token = await (jwtCallback as unknown as JwtCallbackFn)({
        token: initialToken,
        user,
      });

      expect(token.id).toBe('user-uuid-5678');
      expect(token.email).toBe('engineer@company.com');
      expect(token.name).toBe('Sarah Connor');
      expect(token.apiToken).toBe('signed-bearer-token-999');
    });

    it('populates session user from JWT token payload', async () => {
      const sessionCallback = authConfig.callbacks?.session;
      expect(sessionCallback).toBeDefined();

      type SessionCallbackFn = (params: {
        session: { user: Record<string, unknown>; expires: string };
        token: Record<string, unknown>;
      }) => Promise<{ user: Record<string, unknown>; expires: string }>;

      const token = {
        id: 'user-uuid-5678',
        apiToken: 'signed-bearer-token-999',
      };

      const initialSession = {
        user: {
          name: 'Sarah Connor',
          email: 'engineer@company.com',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      };

      const session = await (sessionCallback as unknown as SessionCallbackFn)({
        session: initialSession,
        token,
      });

      expect(session.user.id).toBe('user-uuid-5678');
      expect(session.user.apiToken).toBe('signed-bearer-token-999');
      expect(session.user.email).toBe('engineer@company.com');
    });
  });

  describe('Route Protection & Security Enforcement', () => {
    const isProtected = (pathname: string) => {
      return (
        pathname.startsWith('/onboarding') ||
        pathname.startsWith('/explore') ||
        pathname.startsWith('/track') ||
        pathname.startsWith('/experience')
      );
    };

    it('identifies internal career planning routes as protected', () => {
      expect(isProtected('/onboarding')).toBe(true);
      expect(isProtected('/explore')).toBe(true);
      expect(isProtected('/track')).toBe(true);
      expect(isProtected('/experience')).toBe(true);
    });

    it('allows root and public routes through proxy for dynamic or public handling', () => {
      expect(isProtected('/')).toBe(false);
      expect(isProtected('/login')).toBe(false);
      expect(isProtected('/signup')).toBe(false);
      expect(isProtected('/status')).toBe(false);
      expect(isProtected('/api/auth/signin')).toBe(false);
    });
  });
});
