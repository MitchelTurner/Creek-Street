import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CacheHeadersInterceptor } from './common/cache-headers.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new CacheHeadersInterceptor());
  // Multipart uploads via FileInterceptor; default JSON body parser is fine.
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Creek Street API listening on http://localhost:${port}/api`);
}

bootstrap();
