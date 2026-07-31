import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

/** Strict CSP for JSON API responses. */
const API_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

/**
 * Document CSP for the Vite SPA + static assets.
 * Allows self scripts/styles, Google Fonts, OSM raster tiles, and MapLibre workers.
 */
const SPA_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
  "connect-src 'self' https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/** Security headers + request id + structured access log line. */
export function securityAndRequestLog(req: Request, res: Response, next: NextFunction) {
  const requestId =
    (typeof req.headers['x-request-id'] === 'string' && req.headers['x-request-id']) ||
    randomUUID();
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  const path = req.path || req.url || '';
  const isApi = path === '/api' || path.startsWith('/api/');
  res.setHeader('Content-Security-Policy', isApi ? API_CSP : SPA_CSP);

  const started = Date.now();
  res.on('finish', () => {
    const line = JSON.stringify({
      type: 'access',
      requestId,
      method: req.method,
      path: req.originalUrl ?? req.url,
      status: res.statusCode,
      ms: Date.now() - started,
      ip: req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? null,
    });
    // eslint-disable-next-line no-console
    console.log(line);
  });

  next();
}
