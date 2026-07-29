import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Response } from 'express';

/**
 * CDN-friendly defaults for anonymous public GET responses.
 * Skip auth'd / mutating routes and leave existing explicit Cache-Control alone.
 */
@Injectable()
export class CacheHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<{ method?: string; path?: string; url?: string; headers?: Record<string, string> }>();
    const res = http.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        if ((req.method ?? 'GET').toUpperCase() !== 'GET') return;
        if (req.headers?.authorization) return;

        const path = req.path ?? req.url ?? '';
        if (
          path.includes('/auth') ||
          path.includes('/applicant') ||
          path.includes('/official') ||
          path.includes('/ingest') ||
          path.includes('/admin') ||
          path.includes('/summaries/') // staff review paths
        ) {
          res.setHeader('Cache-Control', 'private, no-store');
          return;
        }

        if (res.getHeader('Cache-Control')) return;

        // Static-first public mirror defaults
        if (
          path.includes('/opendata') ||
          path.includes('/map') ||
          path.includes('/guidance') ||
          path.includes('/structures') ||
          path.includes('/tourism')
        ) {
          res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
          res.setHeader('Vary', 'Accept-Encoding');
          return;
        }

        if (
          path.includes('/applications') ||
          path.includes('/meetings') ||
          path.includes('/decisions') ||
          path.includes('/seats') ||
          path.includes('/summaries') ||
          path.includes('/construction')
        ) {
          res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
          res.setHeader('Vary', 'Accept-Encoding');
        }
      }),
    );
  }
}
