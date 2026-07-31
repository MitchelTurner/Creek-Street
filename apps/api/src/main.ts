import 'reflect-metadata';
import { existsSync } from 'fs';
import { join, sep } from 'path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { CacheHeadersInterceptor } from './common/cache-headers.interceptor';
import { securityAndRequestLog } from './ops/security.middleware';

function resolveWebDist(): string {
  if (process.env.WEB_DIST?.trim()) return process.env.WEB_DIST.trim();
  // npm -w start uses package cwd (apps/api); Docker WORKDIR may be monorepo root.
  const candidates = [
    join(process.cwd(), '..', 'web', 'dist'),
    join(process.cwd(), 'apps', 'web', 'dist'),
    join(__dirname, '..', '..', '..', 'web', 'dist'),
  ];
  return candidates.find((p) => existsSync(join(p, 'index.html'))) ?? candidates[0]!;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.use(securityAndRequestLog);
  app.useGlobalInterceptors(new CacheHeadersInterceptor());

  const webDist = resolveWebDist();
  const indexHtml = join(webDist, 'index.html');
  if (existsSync(indexHtml)) {
    app.useStaticAssets(webDist, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.endsWith(`${sep}index.html`) || filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store');
          return;
        }
        if (filePath.includes(`${sep}assets${sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return;
        }
        // hero image and other public root files
        res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
      },
    });
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path.startsWith('/api')) return next();
      // Missing fingerprinted assets should 404, not return the SPA shell.
      if (/\.[a-zA-Z0-9]+$/.test(req.path)) return next();
      res.setHeader('Cache-Control', 'no-store');
      return res.sendFile(indexHtml);
    });
    // eslint-disable-next-line no-console
    console.log(`Serving web UI from ${webDist}`);
  } else {
    // eslint-disable-next-line no-console
    console.warn(`Web dist not found at ${webDist} — API-only mode`);
  }

  const port = Number(process.env.PORT ?? 3001);
  const build =
    process.env.BUILD_SHA ||
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    'local';
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Creek Street listening on http://0.0.0.0:${port} (API /api) build=${build}`);
}

bootstrap();
