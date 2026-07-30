import { Injectable } from '@nestjs/common';
import { DigestService } from '../calendar/digest.service';
import { AuditStore } from '../compliance/audit.store';
import { ComplianceService } from '../compliance/compliance.service';
import { GeoService } from '../geo/geo.service';
import { IngestQueueService } from '../ingest/ingest.queue';
import { IngestStore } from '../ingest/ingest.store';
import { MailService } from '../ops/mail.service';
import { ReadinessService } from '../public/readiness.service';
import { OpsBriefService } from './ops-brief.service';

/**
 * Phase 15 — consolidated staff ops snapshot.
 */
@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly readiness: ReadinessService,
    private readonly geo: GeoService,
    private readonly mail: MailService,
    private readonly digest: DigestService,
    private readonly audit: AuditStore,
    private readonly compliance: ComplianceService,
    private readonly ingestQueue: IngestQueueService,
    private readonly ingestStore: IngestStore,
    private readonly opsBrief: OpsBriefService,
  ) {}

  async snapshot() {
    const ready = await this.readiness.check();
    const geo = await this.geo.status();
    const checklist = this.compliance.readinessChecklist();
    const openItems = checklist.items.filter((i) => !i.done);

    return {
      phase: 15,
      at: new Date().toISOString(),
      ready,
      geo: {
        noticeMethod: geo.noticeMethod,
        postgis: geo.postgis,
        pgvector: geo.pgvector,
        prismaEnabled: geo.prismaEnabled,
      },
      mail: this.mail.status(),
      digest: this.digest.lastDigest(),
      opsBrief: this.opsBrief.lastBrief(),
      ingest: {
        queue: this.ingestQueue.status(),
        sources: this.ingestStore.listSources().map((s) => ({
          id: s.id,
          label: s.label,
          lastStatus: s.watermark.lastStatus,
          lastRunAt: s.watermark.lastRunAt,
          lastMessage: s.watermark.lastMessage,
        })),
        recentRuns: this.ingestStore.listRuns(8),
      },
      compliance: {
        score: checklist.score,
        deliberationUnlocked: checklist.deliberationUnlocked,
        openItems: openItems.map((i) => ({ id: i.id, label: i.label, detail: i.detail })),
        contractMessage: checklist.message,
      },
      recentAudit: this.audit.list({ limit: 12 }),
      links: {
        queue: '/admin/queue',
        ingest: '/admin/ingest',
        compliance: '/compliance',
        briefPreview: '/api/ops/brief/preview',
        digestPreview: '/api/digest/preview',
        meetingsIcs: '/api/meetings.ics',
        ready: '/api/ready',
        geo: '/api/geo/status',
      },
    };
  }
}
