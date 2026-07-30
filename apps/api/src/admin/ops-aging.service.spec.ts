import { describe, expect, it } from 'vitest';
import { OpsAgingService } from './ops-aging.service';

describe('OpsAgingService', () => {
  const now = Date.parse('2026-07-30T12:00:00.000Z');

  function makeSvc(overrides?: { sendAccepted?: boolean }) {
    return new OpsAgingService(
      {
        snapshot: () => ({
          phase: 16,
          counts: {
            pendingPhotos: 1,
            pendingSummaries: 1,
            failedIngestRuns: 1,
            failedSources: 1,
            total: 3,
          },
          pendingPhotos: [
            {
              id: 'photo_old',
              structureId: 'struct_dollys',
              caption: 'Old boardwalk',
              credit: 'x',
              yearApprox: 1918,
              submitterEmail: 'a@example.com',
              createdAt: '2026-07-27T12:00:00.000Z', // 72h
              moderationStatus: 'PENDING',
            },
          ],
          pendingSummaries: [
            {
              id: 'sum_draft',
              meetingId: 'mtg_1',
              body: 'AI DRAFT SECRET MUST NOT APPEAR',
              model: 'stub',
              generatedAt: '2026-07-01T00:00:00.000Z',
              isPublished: false,
              humanReviewed: false,
              meeting: null,
            },
          ],
          failedIngestRuns: [
            {
              id: 'run_fail',
              sourceId: 'clerk_agendas',
              status: 'failed',
              message: 'robots blocked',
              startedAt: '2026-07-28T18:00:00.000Z',
              finishedAt: '2026-07-28T18:00:02.000Z',
            },
          ],
        }),
      } as never,
      { listStaffEmails: () => ['staff@example.com'] } as never,
      {
        send: async () => ({
          mode: 'stub',
          accepted: overrides?.sendAccepted !== false,
        }),
      } as never,
    );
  }

  it('marks aged queue items stale and omits AI summary body from alert email', async () => {
    const svc = makeSvc();
    const snap = svc.snapshot(now);
    expect(snap.phase).toBe(18);
    expect(snap.counts.stalePhotos).toBe(1);
    expect(snap.counts.staleSummaries).toBe(1);
    expect(snap.counts.staleIngestRuns).toBe(1);
    expect(snap.counts.staleTotal).toBe(3);
    expect(snap.staleSummaries[0]).not.toHaveProperty('body');

    const { body } = svc.buildAlertBody('https://creek.example', now);
    expect(body).toContain('stale queue alert');
    expect(body).toContain('photo_old');
    expect(body).toContain('sum_draft');
    expect(body).not.toContain('AI DRAFT SECRET MUST NOT APPEAR');

    const preview = svc.previewAlert('https://creek.example', now);
    expect(preview.wouldSend).toBe(true);
    expect(preview.body).not.toContain('AI DRAFT SECRET MUST NOT APPEAR');

    const sent = await svc.sendAlert({ origin: 'https://creek.example', nowMs: now });
    expect(sent.sent).toBe(true);
    expect(sent.reason).toBe('SENT');
    expect(sent.recipients).toBe(1);

    const cooled = await svc.sendAlert({ origin: 'https://creek.example', nowMs: now + 1000 });
    expect(cooled.sent).toBe(false);
    expect(cooled.reason).toBe('COOLDOWN');

    const forced = await svc.sendAlert({
      origin: 'https://creek.example',
      nowMs: now + 2000,
      force: true,
    });
    expect(forced.sent).toBe(true);
  });

  it('skips send when nothing is stale', async () => {
    const svc = new OpsAgingService(
      {
        snapshot: () => ({
          counts: {
            pendingPhotos: 0,
            pendingSummaries: 0,
            failedIngestRuns: 0,
            failedSources: 0,
            total: 0,
          },
          pendingPhotos: [],
          pendingSummaries: [],
          failedIngestRuns: [],
        }),
      } as never,
      { listStaffEmails: () => ['staff@example.com'] } as never,
      { send: async () => ({ mode: 'stub', accepted: true }) } as never,
    );
    const result = await svc.sendAlert({ nowMs: now });
    expect(result.sent).toBe(false);
    expect(result.reason).toBe('NO_STALE');
  });
});
