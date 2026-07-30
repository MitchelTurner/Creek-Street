import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../ops/mail.service';
import { ApplicantStore } from '../phase2/applicant.store';
import { ReadinessService } from '../public/readiness.service';
import { OpsQueueService } from './ops-queue.service';

export type OpsBriefResult = {
  at: string;
  recipients: number;
  mode: string;
  subject: string;
  preview: string;
};

/**
 * Phase 17 — staff-only ops brief email (queue + readiness snapshot).
 * Never includes AI summary body, DRAFT applications, or MemberNotes.
 */
@Injectable()
export class OpsBriefService {
  private readonly log = new Logger(OpsBriefService.name);
  private last: OpsBriefResult | null = null;

  constructor(
    private readonly queue: OpsQueueService,
    private readonly readiness: ReadinessService,
    private readonly applicants: ApplicantStore,
    private readonly mail: MailService,
  ) {}

  lastBrief() {
    return this.last;
  }

  async buildBody(origin = 'https://creek-street.local') {
    const base = origin.replace(/\/$/, '');
    const queue = this.queue.snapshot();
    const ready = await this.readiness.check();
    const mail = this.mail.status();

    const photoLines = queue.pendingPhotos.slice(0, 8).map((p) => {
      const ageHours = Math.max(
        0,
        Math.round((Date.now() - new Date(p.createdAt).getTime()) / 3600000),
      );
      return `• ${p.id} — ${p.structureId} — "${p.caption.slice(0, 80)}" (${ageHours}h)`;
    });

    // Metadata only — never paste unreviewed AI summary body into email
    const summaryLines = queue.pendingSummaries.slice(0, 8).map((s) => {
      const when = s.meeting?.scheduledAt
        ? new Date(s.meeting.scheduledAt).toLocaleString('en-US', {
            timeZone: 'America/Juneau',
          })
        : s.generatedAt;
      return `• ${s.id} — meeting ${s.meetingId} — generated/scheduled ${when}`;
    });

    const failLines = queue.failedIngestRuns.slice(0, 8).map((r) => {
      return `• ${r.sourceId} — ${r.message.slice(0, 120)}`;
    });

    const lines = [
      'Creek Street Design Review — staff ops brief',
      '',
      'Staff-only. Independent hub operated by Mitchel Turner Dev, LLC — not a borough property.',
      'This brief never includes DRAFT applications, MemberNotes, or unreviewed AI summary text.',
      '',
      `Open queue items: ${queue.counts.total}`,
      `  Photos pending: ${queue.counts.pendingPhotos}`,
      `  Summaries unreviewed: ${queue.counts.pendingSummaries}`,
      `  Failed ingest runs: ${queue.counts.failedIngestRuns}`,
      '',
      'Pending photos:',
      ...(photoLines.length ? photoLines : ['• (none)']),
      '',
      'Unreviewed summaries (ids only — open /admin/queue to review text):',
      ...(summaryLines.length ? summaryLines : ['• (none)']),
      '',
      'Failed ingest:',
      ...(failLines.length ? failLines : ['• (none)']),
      '',
      'Readiness:',
      `  ready=${ready.ready} phase=${ready.phase} store=${ready.checks.publicBackend}`,
      `  mail=${mail.mode} redis=${ready.checks.redisConfigured ? 'yes' : 'no'}`,
      `  contract: ${ready.contractMessage}`,
      '',
      `Work queue: ${base}/admin/queue`,
      `Ops dashboard: ${base}/admin/ops`,
      `Ingest: ${base}/admin/ingest`,
    ];

    return lines.join('\n');
  }

  async preview(origin?: string) {
    const webOrigin = origin || process.env.PUBLIC_WEB_ORIGIN || 'https://creek-street.local';
    const body = await this.buildBody(webOrigin);
    const subject = 'Creek Street Design Review — staff ops brief';
    return {
      phase: 17,
      subject,
      body,
      staffRecipients: this.applicants.listStaffEmails(),
      last: this.last,
      note: 'Staff-only preview. POST /api/ops/brief/send delivers to STAFF/ADMIN emails. AI summary bodies are never included.',
    };
  }

  async send(origin?: string): Promise<OpsBriefResult> {
    const webOrigin = origin || process.env.PUBLIC_WEB_ORIGIN || 'https://creek-street.local';
    const body = await this.buildBody(webOrigin);
    const subject = 'Creek Street Design Review — staff ops brief';
    const recipients = this.applicants.listStaffEmails();
    let sent = 0;
    let mode = 'stub';

    for (const email of recipients) {
      const result = await this.mail.send({ to: email, subject, text: body });
      mode = result.mode;
      if (result.accepted) sent += 1;
    }

    this.last = {
      at: new Date().toISOString(),
      recipients: sent,
      mode,
      subject,
      preview: body.slice(0, 280),
    };
    this.log.log(`Ops brief recipients=${sent} mode=${mode}`);
    return this.last;
  }
}
