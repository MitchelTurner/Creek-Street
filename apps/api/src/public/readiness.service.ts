import { Injectable } from '@nestjs/common';
import { GeoService } from '../geo/geo.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReadinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geo: GeoService,
  ) {}

  async check() {
    const geo = await this.geo.status();
    const memoryDefault = (process.env.USE_MEMORY_STORE ?? 'true').toLowerCase() !== 'false';
    const redisConfigured = Boolean(process.env.REDIS_URL);
    const phase3Active =
      (process.env.PHASE3_CONTRACT_ACTIVE ?? 'false').toLowerCase() === 'true' &&
      Boolean(process.env.PHASE3_CUSTODIAN?.trim()) &&
      Boolean(process.env.PHASE3_AGREEMENT_ID?.trim()) &&
      Boolean(process.env.PHASE3_AGREEMENT_EFFECTIVE?.trim()) &&
      Boolean(process.env.PHASE3_RETENTION_SCHEDULE_URL?.trim()) &&
      Boolean(process.env.PHASE3_RECORDS_REQUEST_CONTACT?.trim()) &&
      (process.env.PHASE3_OMA_NOTICE_INTEGRATION ?? 'false').toLowerCase() === 'true';

    const checks = {
      api: true,
      memoryStore: memoryDefault,
      prisma: this.prisma.enabled,
      redisConfigured,
      postgis: geo.postgis,
      pgvector: geo.pgvector,
      phase3Contract: phase3Active,
    };

    return {
      ready: checks.api,
      phase: 8,
      checks,
      noticeMethod: geo.noticeMethod,
      contractMessage: phase3Active
        ? 'Official workflow unlocked'
        : 'Official deliberation dark (expected until MOU)',
      at: new Date().toISOString(),
    };
  }
}
