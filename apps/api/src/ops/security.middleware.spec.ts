import { describe, expect, it, vi } from 'vitest';
import { securityAndRequestLog } from './security.middleware';

function run(path: string) {
  const headers: Record<string, string> = {};
  const req = { path, url: path, method: 'GET', headers: {}, socket: {} } as never;
  const res = {
    setHeader: (k: string, v: string) => {
      headers[k] = v;
    },
    on: vi.fn(),
    statusCode: 200,
  } as never;
  const next = vi.fn();
  securityAndRequestLog(req, res, next);
  return { headers, next };
}

describe('securityAndRequestLog CSP', () => {
  it('keeps API responses locked down', () => {
    const { headers, next } = run('/api/health');
    expect(next).toHaveBeenCalled();
    expect(headers['Content-Security-Policy']).toContain("default-src 'none'");
    expect(headers['Content-Security-Policy']).not.toContain("script-src 'self'");
  });

  it('allows SPA scripts, styles, fonts, and OSM tiles on document routes', () => {
    const { headers } = run('/');
    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain('https://fonts.googleapis.com');
    expect(csp).toContain('https://tile.openstreetmap.org');
    expect(csp).toContain("worker-src 'self' blob:");
  });
});
