import { Injectable } from '@nestjs/common';
import { GeoService } from '../geo/geo.service';
import { MailService } from '../ops/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { PublicStore } from '../store/public.store';

@Injectable()
export class ReadinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geo: GeoService,
    private readonly mail: MailService,
    private readonly publicStore: PublicStore,
  ) {}

  async check() {
    const geo = await this.geo.status();
    const mail = this.mail.status();
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
      publicBackend: this.publicStore.backend(),
      redisConfigured,
      postgis: geo.postgis,
      pgvector: geo.pgvector,
      phase3Contract: phase3Active,
      mail: mail.mode,
      rateLimitEnabled: (process.env.RATE_LIMIT_DISABLED ?? 'false').toLowerCase() !== 'true',
    };

    return {
      ready: checks.api,
      phase: 24,
      checks,
      noticeMethod: geo.noticeMethod,
      mail,
      contractMessage: phase3Active
        ? 'Official workflow unlocked'
        : 'Official deliberation dark (expected until MOU)',
      at: new Date().toISOString(),
    };
  }
}
