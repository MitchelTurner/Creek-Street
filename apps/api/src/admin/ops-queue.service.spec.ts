import { describe, expect, it } from 'vitest';
import { OpsQueueService } from './ops-queue.service';

describe('OpsQueueService', () => {
  it('assembles pending photos, unreviewed summaries, and failed ingest runs', () => {
    const svc = new OpsQueueService(
      {
        listPendingPhotos: () => [
          {
            id: 'photo_1',
            structureId: 'struct_dollys',
            caption: 'Boardwalk c. 1920',
            credit: 'Neighbor',
            yearApprox: 1920,
            submitterEmail: 'neighbor@example.com',
            createdAt: '2026-07-01T00:00:00.000Z',
            moderationStatus: 'PENDING',
          },
        ],
      } as never,
      {
        listAllSummariesForStaff: () => [
          {
            id: 'sum_draft',
            meetingId: 'mtg_1',
            body: 'AI DRAFT',
            model: 'stub',
            generatedAt: '2026-07-01T00:00:00.000Z',
            reviewedAt: null,
            isPublished: false,
            humanReviewed: false,
            meeting: {
              id: 'mtg_1',
              scheduledAt: '2026-08-01T18:00:00.000Z',
              location: 'City Hall',
              status: 'SCHEDULED',
            },
          },
          {
            id: 'sum_done',
            meetingId: 'mtg_0',
            body: 'Published',
            model: 'stub',
            generatedAt: '2026-06-01T00:00:00.000Z',
            reviewedAt: '2026-06-02T00:00:00.000Z',
            isPublished: true,
            humanReviewed: true,
            meeting: null,
          },
        ],
      } as never,
      {
        listRuns: () => [
          {
            id: 'run_fail',
            sourceId: 'clerk_agendas',
            status: 'failed',
            message: 'robots blocked',
            startedAt: '2026-07-02T00:00:00.000Z',
            finishedAt: '2026-07-02T00:01:00.000Z',
          },
          {
            id: 'run_ok',
            sourceId: 'nrhp_seed',
            status: 'succeeded',
            message: 'ok',
            startedAt: '2026-07-02T00:00:00.000Z',
            finishedAt: '2026-07-02T00:01:00.000Z',
          },
        ],
        listSources: () => [
          {
            id: 'clerk_agendas',
            label: 'Clerk agendas',
            watermark: {
              lastStatus: 'failed',
              lastRunAt: '2026-07-02T00:01:00.000Z',
              lastMessage: 'robots blocked',
            },
          },
        ],
      } as never,
    );

    const snap = svc.snapshot();
    expect(snap.phase).toBe(16);
    expect(snap.counts.pendingPhotos).toBe(1);
    expect(snap.counts.pendingSummaries).toBe(1);
    expect(snap.counts.failedIngestRuns).toBe(1);
    expect(snap.pendingSummaries[0]?.id).toBe('sum_draft');
    expect(snap.failedIngestRuns[0]?.status).toBe('failed');
    expect(snap.links.ui.queue).toBe('/admin/queue');
  });
});
