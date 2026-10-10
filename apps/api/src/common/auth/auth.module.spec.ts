import { describe, expect, it } from 'vitest';
import { AuthModule } from './auth.module.js';

describe('AuthModule', () => {
  it('succeeds onModuleInit in test and development environments', () => {
    const module = new AuthModule();
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'test';
      expect(() => module.onModuleInit()).not.toThrow();

      process.env.NODE_ENV = 'development';
      expect(() => module.onModuleInit()).not.toThrow();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('throws in production environment', () => {
    const module = new AuthModule();
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      expect(() => module.onModuleInit()).toThrow(
        /DevHeaderUserProvider cannot be loaded/i,
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('throws in staging environment (fails closed)', () => {
    const module = new AuthModule();
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'staging';
      expect(() => module.onModuleInit()).toThrow(
        /DevHeaderUserProvider cannot be loaded/i,
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('throws when NODE_ENV is unset (fails closed)', () => {
    const module = new AuthModule();
    const originalEnv = process.env.NODE_ENV;
    try {
      delete process.env.NODE_ENV;
      expect(() => module.onModuleInit()).toThrow(
        /DevHeaderUserProvider cannot be loaded/i,
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
