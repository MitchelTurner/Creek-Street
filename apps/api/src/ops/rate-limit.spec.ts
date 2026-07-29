import { describe, expect, it } from 'vitest';
import { resetRateLimitStore, takeToken } from './rate-limit';

describe('takeToken rate limit', () => {
  it('allows up to limit then blocks within the window', () => {
    resetRateLimitStore();
    const store = new Map();
    const opts = { name: 'test', limit: 3, windowMs: 60_000 };
    const now = 1_000_000;
    expect(takeToken('1.1.1.1', opts, now, store).allowed).toBe(true);
    expect(takeToken('1.1.1.1', opts, now + 1, store).allowed).toBe(true);
    expect(takeToken('1.1.1.1', opts, now + 2, store).remaining).toBe(0);
    expect(takeToken('1.1.1.1', opts, now + 3, store).allowed).toBe(false);
  });

  it('resets after the window elapses', () => {
    const store = new Map();
    const opts = { name: 'test2', limit: 1, windowMs: 100 };
    expect(takeToken('a', opts, 0, store).allowed).toBe(true);
    expect(takeToken('a', opts, 50, store).allowed).toBe(false);
    expect(takeToken('a', opts, 101, store).allowed).toBe(true);
  });

  it('isolates keys and prefixes', () => {
    const store = new Map();
    const opts = { name: 'auth', limit: 1, windowMs: 1000 };
    expect(takeToken('ip-a', opts, 0, store).allowed).toBe(true);
    expect(takeToken('ip-b', opts, 0, store).allowed).toBe(true);
    expect(takeToken('ip-a', { ...opts, name: 'photos' }, 0, store).allowed).toBe(true);
  });
});
