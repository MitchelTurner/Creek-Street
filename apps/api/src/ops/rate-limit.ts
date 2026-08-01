import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  /** Max requests per window */
  limit: number;
  /** Window length in ms */
  windowMs: number;
  /** Key prefix (route family) */
  name: string;
};

/** Pure helper — exported for unit tests. */
export function takeToken(
  key: string,
  opts: RateLimitOptions,
  now = Date.now(),
  store: Map<string, Bucket> = buckets,
): { allowed: boolean; remaining: number; resetAt: number } {
  const fullKey = `${opts.name}:${key}`;
  let bucket = store.get(fullKey);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + opts.windowMs };
    store.set(fullKey, bucket);
  }
  if (bucket.count >= opts.limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, opts.limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

export function resetRateLimitStore() {
  buckets.clear();
}

function clientKey(req: { ip?: string; headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }) {
  const xf = req.headers?.['x-forwarded-for'];
  const forwarded = Array.isArray(xf) ? xf[0] : xf?.split(',')[0]?.trim();
  return forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
}

function guardFor(opts: RateLimitOptions) {
  @Injectable()
  class RateLimitGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      if ((process.env.RATE_LIMIT_DISABLED ?? 'false').toLowerCase() === 'true') {
        return true;
      }
      const req = context.switchToHttp().getRequest();
      const res = context.switchToHttp().getResponse();
      const result = takeToken(clientKey(req), opts);
      res.setHeader?.('X-RateLimit-Limit', String(opts.limit));
      res.setHeader?.('X-RateLimit-Remaining', String(result.remaining));
      res.setHeader?.('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
      if (!result.allowed) {
        throw new HttpException(
          {
            error: 'RATE_LIMITED',
            message: `Too many requests for ${opts.name}. Try again shortly.`,
            retryAfterSec: Math.ceil((result.resetAt - Date.now()) / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      return true;
    }
  }
  return RateLimitGuard;
}

/** Auth / registration — tight. */
export const AuthRateLimitGuard = guardFor({
  name: 'auth',
  limit: Number(process.env.RATE_LIMIT_AUTH ?? 20),
  windowMs: 60_000,
});

/** Subscription create — moderate. */
export const SubscriptionRateLimitGuard = guardFor({
  name: 'subscriptions',
  limit: Number(process.env.RATE_LIMIT_SUBSCRIPTIONS ?? 30),
  windowMs: 60_000,
});

/** Photo submit — moderate. */
export const PhotoRateLimitGuard = guardFor({
  name: 'photos',
  limit: Number(process.env.RATE_LIMIT_PHOTOS ?? 15),
  windowMs: 60_000,
});

/** Claude civic-idea generation — tight (paid API). */
export const IdeasAiRateLimitGuard = guardFor({
  name: 'ideas-ai',
  limit: Number(process.env.RATE_LIMIT_IDEAS_AI ?? 8),
  windowMs: 60 * 60_000,
});
