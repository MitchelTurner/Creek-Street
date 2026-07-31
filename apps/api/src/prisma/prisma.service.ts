import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Optional Postgres client. Memory store remains the default for local/demo.
 * Connect when USE_MEMORY_STORE=false and DATABASE_URL is set.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(PrismaService.name);
  private ready = false;

  get enabled() {
    return this.ready;
  }

  shouldConnect() {
    const memory = (process.env.USE_MEMORY_STORE ?? 'true').toLowerCase() !== 'false';
    return !memory && Boolean(process.env.DATABASE_URL);
  }

  async onModuleInit() {
    if (!this.shouldConnect()) {
      this.log.warn('Prisma idle — USE_MEMORY_STORE!=false or DATABASE_URL unset.');
      return;
    }
    try {
      await this.$connect();
      this.ready = true;
      this.log.log('Prisma connected to Postgres');
    } catch (e) {
      this.ready = false;
      this.log.error(`Prisma connect failed: ${(e as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.ready) await this.$disconnect();
  }

  async rawQuery<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (!this.ready) return [];
    return this.$queryRawUnsafe<T[]>(sql as string, ...params);
  }
}

