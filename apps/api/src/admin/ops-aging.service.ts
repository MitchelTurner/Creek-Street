import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../ops/mail.service';
import { ApplicantStore } from '../phase2/applicant.store';
import { OpsClaimService } from './ops-claim.service';
import { OpsQueueService } from './ops-queue.service';

export type OpsAlertResult = {
  at: string;
  sent: boolean;
  reason: 'SENT' | 'NO_STALE' | 'COOLDOWN';
  recipients: number;
  mode: string | null;
  subject: string | null;
  preview: string | null;
  staleTotal: number;
  cooldownHours: number;
  nextEligibleAt: string | null;
};

function hoursSince(iso: string, nowMs = Date.now()) {
  return Math.max(0, (nowMs - new Date(iso).getTime()) / 3600000);
}

function envHours(key: string, fallback: number) {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Phase 18 — queue aging + conditional staff stale alerts.
 * Alert email never includes AI summary body, DRAFT apps, or MemberNotes.
 */
@Injectable()
export class OpsAgingService {
  private readonly log = new Logger(OpsAgingService.name);
  private lastAlert: OpsAlertResult | null = null;

  constructor(
    private readonly queue: OpsQueueService,
    private readonly applicants: ApplicantStore,
    private readonly mail: MailService,
    private readonly claims: OpsClaimService,
  ) {}

  thresholds() {
    return {
      photoHours: envHours('OPS_STALE_PHOTO_HOURS', 48),
      summaryHours: envHours('OPS_STALE_SUMMARY_HOURS', 24),
      ingestHours: envHours('OPS_STALE_INGEST_HOURS', 12),
      alertCooldownHours: envHours('OPS_ALERT_COOLDOWN_HOURS', 6),
    };
  }

  lastAlertResult() {
    return this.lastAlert;
  }

  snapshot(nowMs = Date.now()) {
    const queue = this.queue.snapshot();
    const t = this.thresholds();

    const pendingPhotos = queue.pendingPhotos.map((p) => {
      const ageHours = Math.round(hoursSince(p.createdAt, nowMs) * 10) / 10;
      return { ...p, ageHours, stale: ageHours >= t.photoHours };
    });
    const pendingSummaries = queue.pendingSummaries.map((s) => {
      const ageHours = Math.round(hoursSince(s.generatedAt, nowMs) * 10) / 10;
      return { ...s, ageHours, stale: ageHours >= t.summaryHours };
    });
    const failedIngestRuns = queue.failedIngestRuns.map((r) => {
      const stamp = r.finishedAt ?? r.startedAt;
      const ageHours = Math.round(hoursSince(stamp, nowMs) * 10) / 10;
      return { ...r, ageHours, stale: ageHours >= t.ingestHours };
    });

    const stalePhotos = pendingPhotos.filter((p) => p.stale);
    const staleSummaries = pendingSummaries.filter((s) => s.stale);
    const staleIngestRuns = failedIngestRuns.filter((r) => r.stale);

    return {
      phase: 18,
      at: new Date(nowMs).toISOString(),
      thresholds: t,
      counts: {
        ...queue.counts,
        stalePhotos: stalePhotos.length,
        staleSummaries: staleSummaries.length,
        staleIngestRuns: staleIngestRuns.length,
        staleTotal: stalePhotos.length + staleSummaries.length + staleIngestRuns.length,
      },
      pendingPhotos,
      pendingSummaries,
      failedIngestRuns,
      stalePhotos: stalePhotos.map((p) => ({
        id: p.id,
        structureId: p.structureId,
        caption: p.caption,
        createdAt: p.createdAt,
        ageHours: p.ageHours,
      })),
      staleSummaries: staleSummaries.map((s) => ({
        id: s.id,
        meetingId: s.meetingId,
        generatedAt: s.generatedAt,
        ageHours: s.ageHours,
        // intentionally omit body
      })),
      staleIngestRuns: staleIngestRuns.map((r) => ({
        id: r.id,
        sourceId: r.sourceId,
        message: r.message,
        finishedAt: r.finishedAt,
        ageHours: r.ageHours,
      })),
      lastAlert: this.lastAlert,
      links: {
        queue: '/admin/queue',
        ops: '/admin/ops',
        alertPreview: '/api/ops/alerts/preview',
        alertSend: 'POST /api/ops/alerts/send',
      },
      note: 'Stale alerts are staff-only. Unreviewed AI summary bodies are never emailed.',
    };
  }

  /** Enrich the Phase 16 queue payload with age/stale flags + claims. */
  enrichedQueue(nowMs = Date.now()) {
    const aging = this.snapshot(nowMs);
    const base = this.queue.snapshot();
    const claimSummary = this.claims.summary(nowMs);
    return {
      ...base,
      phase: 20,
      counts: {
        ...aging.counts,
        claimed: claimSummary.activeCount,
      },
      pendingPhotos: this.claims.enrichQueueItems('photo', aging.pendingPhotos, nowMs),
      pendingSummaries: this.claims.enrichQueueItems(
        'summary',
        aging.pendingSummaries,
        nowMs,
      ),
      failedIngestRuns: this.claims.enrichQueueItems(
        'ingest',
        aging.failedIngestRuns,
        nowMs,
      ),
      aging: {
        thresholds: aging.thresholds,
        staleTotal: aging.counts.staleTotal,
        stalePhotos: aging.counts.stalePhotos,
        staleSummaries: aging.counts.staleSummaries,
        staleIngestRuns: aging.counts.staleIngestRuns,
      },
      claims: claimSummary,
      lastAlert: this.lastAlert,
    };
  }

  buildAlertBody(origin = 'https://creek-street.local', nowMs = Date.now()) {
    const base = origin.replace(/\/$/, '');
    const aging = this.snapshot(nowMs);
    const lines = [
      'Creek Street Design Review — stale queue alert',
      '',
      'Staff-only. Independent hub operated by Mitchel Turner Dev, LLC — not a borough property.',
      'This alert never includes DRAFT applications, MemberNotes, or unreviewed AI summary text.',
      '',
      `Stale items: ${aging.counts.staleTotal}`,
      `  Photos ≥ ${aging.thresholds.photoHours}h: ${aging.counts.stalePhotos}`,
      `  Summaries ≥ ${aging.thresholds.summaryHours}h: ${aging.counts.staleSummaries}`,
      `  Failed ingest ≥ ${aging.thresholds.ingestHours}h: ${aging.counts.staleIngestRuns}`,
      '',
      'Stale photos:',
      ...(aging.stalePhotos.length
        ? aging.stalePhotos
            .slice(0, 10)
            .map(
              (p) =>
                `• ${p.id} — ${p.structureId} — "${p.caption.slice(0, 60)}" (${p.ageHours}h)`,
            )
        : ['• (none)']),
      '',
      'Stale summaries (ids only — open /admin/queue to review text):',
      ...(aging.staleSummaries.length
        ? aging.staleSummaries
            .slice(0, 10)
            .map((s) => `• ${s.id} — meeting ${s.meetingId} (${s.ageHours}h)`)
        : ['• (none)']),
      '',
      'Stale failed ingest:',
      ...(aging.staleIngestRuns.length
        ? aging.staleIngestRuns
            .slice(0, 10)
            .map((r) => `• ${r.sourceId} — ${r.message.slice(0, 100)} (${r.ageHours}h)`)
        : ['• (none)']),
      '',
      `Work queue: ${base}/admin/queue`,
      `Ops dashboard: ${base}/admin/ops`,
    ];
    return { body: lines.join('\n'), aging };
  }

  previewAlert(origin?: string, nowMs = Date.now()) {
    const webOrigin = origin || process.env.PUBLIC_WEB_ORIGIN || 'https://creek-street.local';
    const { body, aging } = this.buildAlertBody(webOrigin, nowMs);
    const subject = 'Creek Street Design Review — stale queue alert';
    const cooldown = this.cooldownStatus(nowMs);
    const wouldSend = aging.counts.staleTotal > 0 && !cooldown.active;
    return {
      phase: 18,
      subject,
      body,
      staffRecipients: this.applicants.listStaffEmails(),
      wouldSend,
      reason: aging.counts.staleTotal === 0 ? 'NO_STALE' : cooldown.active ? 'COOLDOWN' : 'SENT',
      staleTotal: aging.counts.staleTotal,
      thresholds: aging.thresholds,
      cooldown,
      lastAlert: this.lastAlert,
      note: 'Staff-only. POST /api/ops/alerts/send delivers only when stale work exists and cooldown elapsed (?force=1 to bypass cooldown).',
    };
  }

  async sendAlert(opts: {
    origin?: string;
    force?: boolean;
    nowMs?: number;
  }): Promise<OpsAlertResult> {
    const nowMs = opts.nowMs ?? Date.now();
    const webOrigin = opts.origin || process.env.PUBLIC_WEB_ORIGIN || 'https://creek-street.local';
    const { body, aging } = this.buildAlertBody(webOrigin, nowMs);
    const t = aging.thresholds;
    const subject = 'Creek Street Design Review — stale queue alert';

    if (aging.counts.staleTotal === 0) {
      const result: OpsAlertResult = {
        at: new Date(nowMs).toISOString(),
        sent: false,
        reason: 'NO_STALE',
        recipients: 0,
        mode: null,
        subject: null,
        preview: null,
        staleTotal: 0,
        cooldownHours: t.alertCooldownHours,
        nextEligibleAt: null,
      };
      return result;
    }

    const cooldown = this.cooldownStatus(nowMs);
    if (cooldown.active && !opts.force) {
      return {
        at: new Date(nowMs).toISOString(),
        sent: false,
        reason: 'COOLDOWN',
        recipients: 0,
        mode: null,
        subject: null,
        preview: body.slice(0, 280),
        staleTotal: aging.counts.staleTotal,
        cooldownHours: t.alertCooldownHours,
        nextEligibleAt: cooldown.nextEligibleAt,
      };
    }

    const recipients = this.applicants.listStaffEmails();
    let sent = 0;
    let mode = 'stub';
    for (const email of recipients) {
      const result = await this.mail.send({ to: email, subject, text: body });
      mode = result.mode;
      if (result.accepted) sent += 1;
    }

    this.lastAlert = {
      at: new Date(nowMs).toISOString(),
      sent: true,
      reason: 'SENT',
      recipients: sent,
      mode,
      subject,
      preview: body.slice(0, 280),
      staleTotal: aging.counts.staleTotal,
      cooldownHours: t.alertCooldownHours,
      nextEligibleAt: new Date(nowMs + t.alertCooldownHours * 3600000).toISOString(),
    };
    this.log.log(`Stale alert recipients=${sent} mode=${mode} stale=${aging.counts.staleTotal}`);
    return this.lastAlert;
  }

  private cooldownStatus(nowMs: number) {
    const hours = this.thresholds().alertCooldownHours;
    if (!this.lastAlert?.sent || !this.lastAlert.at) {
      return { active: false, nextEligibleAt: null as string | null, hours };
    }
    const elapsed = hoursSince(this.lastAlert.at, nowMs);
    if (elapsed >= hours) {
      return { active: false, nextEligibleAt: null as string | null, hours };
    }
    const next = new Date(new Date(this.lastAlert.at).getTime() + hours * 3600000).toISOString();
    return { active: true, nextEligibleAt: next, hours };
  }
}
