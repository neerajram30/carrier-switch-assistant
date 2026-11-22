import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || 'career-switch-assistant-dev-secret-key-32-chars-long!',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || '',
      clientSecret: process.env.AUTH_GITHUB_SECRET || '',
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return null;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
          const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (res.ok) {
            const data = await res.json();
            return {
              id: data.user?.id || 'demo-user-1',
              email: data.user?.email || email,
              name: data.user?.name || 'Alex Morgan',
              token: data.accessToken || data.token,
            };
          }
          return null;
        } catch {
          // If the backend API is unreachable in local dev, allow graceful demo sign-in for dev accounts
          if (
            process.env.NODE_ENV !== 'production' &&
            (email === 'dev-user@example.com' || email.includes('demo'))
          ) {
            return {
              id: '00000000-0000-0000-0000-000000000001',
              email,
              name: 'Alex Morgan',
            };
          }
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.apiToken = (user as { token?: string }).token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) {
          session.user.id = token.id as string;
        }
        if (token.apiToken) {
          session.user.apiToken = token.apiToken as string;
        }
      }
      return session;
    },
  },
};
