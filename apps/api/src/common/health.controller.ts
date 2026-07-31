import { Controller, Get, Header } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';

function webDistPresent(): boolean {
  const candidates = [
    process.env.WEB_DIST?.trim(),
    join(process.cwd(), '..', 'web', 'dist', 'index.html'),
    join(process.cwd(), 'apps', 'web', 'dist', 'index.html'),
  ].filter(Boolean) as string[];
  return candidates.some((p) => existsSync(p.endsWith('index.html') ? p : join(p, 'index.html')));
}

@Controller('health')
export class HealthController {
  @Get()
  @Header('Cache-Control', 'no-store')
  health() {
    return {
      status: 'ok',
      ok: true,
      phase: 31,
      ui: 'boardwalk-hero-v1',
      build:
        process.env.BUILD_SHA ||
        process.env.RAILWAY_GIT_COMMIT_SHA ||
        process.env.GITHUB_SHA ||
        null,
      webDist: webDistPresent(),
    };
  }
}
