import { Injectable } from '@nestjs/common';
import { IngestStore } from '../ingest/ingest.store';
import { ApplicantStore } from '../phase2/applicant.store';
import { Phase4Service } from '../phase4/phase4.service';

/**
 * Phase 16 — unified staff work queue (photos, summaries, failed ingest).
 */
@Injectable()
export class OpsQueueService {
  constructor(
    private readonly applicants: ApplicantStore,
    private readonly phase4: Phase4Service,
    private readonly ingestStore: IngestStore,
  ) {}

  snapshot() {
    const pendingPhotos = this.applicants.listPendingPhotos();
    const pendingSummaries = this.phase4
      .listAllSummariesForStaff()
      .filter((s) => !s.reviewedAt);
    const failedIngestRuns = this.ingestStore.listRuns(50).filter((r) => r.status === 'failed');
    const failedSources = this.ingestStore
      .listSources()
      .filter((s) => s.watermark.lastStatus === 'failed')
      .map((s) => ({
        id: s.id,
        label: s.label,
        lastRunAt: s.watermark.lastRunAt,
        lastMessage: s.watermark.lastMessage,
      }));

    return {
      phase: 16,
      at: new Date().toISOString(),
      counts: {
        pendingPhotos: pendingPhotos.length,
        pendingSummaries: pendingSummaries.length,
        failedIngestRuns: failedIngestRuns.length,
        failedSources: failedSources.length,
        total:
          pendingPhotos.length + pendingSummaries.length + failedIngestRuns.length,
      },
      pendingPhotos: pendingPhotos.map((p) => ({
        id: p.id,
        structureId: p.structureId,
        caption: p.caption,
        credit: p.credit,
        yearApprox: p.yearApprox,
        submitterEmail: p.submitterEmail,
        createdAt: p.createdAt,
        moderationStatus: p.moderationStatus,
      })),
      pendingSummaries: pendingSummaries.map((s) => ({
        id: s.id,
        meetingId: s.meetingId,
        body: s.body,
        model: s.model,
        generatedAt: s.generatedAt,
        isPublished: s.isPublished,
        humanReviewed: s.humanReviewed,
        meeting: s.meeting
          ? {
              id: s.meeting.id,
              scheduledAt: s.meeting.scheduledAt,
              location: s.meeting.location,
              status: s.meeting.status,
            }
          : null,
      })),
      failedIngestRuns: failedIngestRuns.map((r) => ({
        id: r.id,
        sourceId: r.sourceId,
        status: r.status,
        message: r.message,
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
      })),
      failedSources,
      links: {
        moderatePhoto: 'POST /api/photos/:id/moderate',
        reviewSummary: 'POST /api/summaries/:id/review',
        ingestStatus: '/api/ingest/status',
        opsDashboard: '/api/ops/dashboard',
        ui: {
          queue: '/admin/queue',
          ops: '/admin/ops',
          ingest: '/admin/ingest',
          photos: '/photos',
        },
      },
      note: 'Unreviewed AI summaries and PENDING photos never appear on public surfaces.',
    };
  }
}
