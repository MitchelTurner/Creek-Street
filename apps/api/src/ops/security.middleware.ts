import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

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
  // API responses are JSON; keep CSP conservative for any accidental HTML.
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

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
