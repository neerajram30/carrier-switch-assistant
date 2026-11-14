import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      apiToken?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    token?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    apiToken?: string;
  }
}
