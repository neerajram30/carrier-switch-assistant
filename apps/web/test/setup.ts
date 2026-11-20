import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!global.ResizeObserver) {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Alex Morgan',
        email: 'dev-user@example.com',
      },
    },
    status: 'authenticated',
  })),
  signIn: vi.fn().mockResolvedValue({ ok: true, error: null }),
  signOut: vi.fn().mockResolvedValue({ ok: true }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));
