import { NestFactory } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { AppModule } from './app.module';

describe('AppModule boot', () => {
  it('resolves the Nest application graph (AuthGuard / PacketsModule)', async () => {
    process.env.USE_MEMORY_STORE = 'true';
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();
    expect(app).toBeDefined();
    await app.close();
  });
});
