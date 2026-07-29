import { afterEach, describe, expect, it, vi } from 'vitest';
import { isUrlAllowed } from './robots';

describe('isUrlAllowed', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hard-blocks borough.ketchikan.ak.us regardless of robots.txt', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await isUrlAllowed('https://borough.ketchikan.ak.us/agendas');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/robots-disallowed/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails closed when robots.txt cannot be fetched', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );

    const result = await isUrlAllowed('https://example.gov/data.json');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/failing closed/i);
  });

  it('allows URLs permitted by robots.txt', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => 'User-agent: *\nAllow: /\n',
      })),
    );

    const result = await isUrlAllowed('https://www.kgbak.us/agendas');
    expect(result.allowed).toBe(true);
  });
});
