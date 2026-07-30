import { describe, expect, it } from 'vitest';
import { OpsBriefService } from './ops-brief.service';

describe('OpsBriefService', () => {
  it('builds a staff brief without AI summary body or DRAFT application text', async () => {
    const svc = new OpsBriefService(
      {
        snapshot: () => ({
          counts: {
            pendingPhotos: 1,
            pendingSummaries: 1,
            failedIngestRuns: 1,
            failedSources: 1,
            total: 3,
          },
          pendingPhotos: [
            {
              id: 'photo_1',
              structureId: 'struct_dollys',
              caption: 'Boardwalk view',
              createdAt: new Date().toISOString(),
            },
          ],
          pendingSummaries: [
            {
              id: 'sum_draft',
              meetingId: 'mtg_2024_02',
              body: 'AI DRAFT SECRET TEXT MUST NOT APPEAR',
              generatedAt: '2026-07-01T00:00:00.000Z',
              meeting: {
                id: 'mtg_2024_02',
                scheduledAt: '2024-02-15T18:00:00.000Z',
                location: 'City Hall',
                status: 'SCHEDULED',
              },
            },
          ],
          failedIngestRuns: [
            {
              id: 'run_1',
              sourceId: 'clerk_agendas',
              message: 'robots blocked',
              status: 'failed',
              startedAt: '2026-07-28T18:00:00.000Z',
              finishedAt: '2026-07-28T18:00:02.000Z',
            },
          ],
        }),
      } as never,
      {
        check: async () => ({
          ready: true,
          phase: 17,
          checks: { publicBackend: 'memory', redisConfigured: false },
          contractMessage: 'Official deliberation dark (expected until MOU)',
        }),
      } as never,
      { listStaffEmails: () => ['staff@example.com'] } as never,
      {
        status: () => ({ mode: 'stub', sent: 0, failed: 0, from: 'x' }),
        send: async () => ({ mode: 'stub', accepted: true }),
      } as never,
    );

    const body = await svc.buildBody('https://creek.example');
    expect(body).toContain('staff ops brief');
    expect(body).toContain('photo_1');
    expect(body).toContain('sum_draft');
    expect(body).toContain('mtg_2024_02');
    expect(body).toContain('/admin/queue');
    expect(body).not.toContain('AI DRAFT SECRET TEXT MUST NOT APPEAR');
    expect(body).toContain('never includes DRAFT applications, MemberNotes');

    const preview = await svc.preview('https://creek.example');
    expect(preview.phase).toBe(17);
    expect(preview.staffRecipients).toEqual(['staff@example.com']);
    expect(preview.body).not.toContain('AI DRAFT SECRET TEXT MUST NOT APPEAR');

    const sent = await svc.send('https://creek.example');
    expect(sent.recipients).toBe(1);
    expect(sent.mode).toBe('stub');
    expect(svc.lastBrief()?.subject).toContain('staff ops brief');
  });
});
