import { describe, expect, it } from 'vitest';
import { MeetingPrepService } from './meeting-prep.service';

describe('MeetingPrepService', () => {
  it('builds prep for seed meeting without DRAFT apps or AI summary body', () => {
    const svc = new MeetingPrepService(
      {
        similarApplications: () => ({
          results: [
            {
              score: 0.4,
              application: {
                id: 'app_other',
                caseNumber: 'HDR-OTHER',
                status: 'APPROVED',
              },
            },
            {
              score: 0.9,
              application: {
                id: 'app_sample_pending',
                caseNumber: 'HDR-SAMPLE-003',
                status: 'SCHEDULED',
              },
            },
          ],
        }),
      } as never,
      {
        listNotes: () => [{ id: 'n1', body: 'private scratch' }],
      } as never,
      {
        status: () => ({ active: false, message: 'dark', missing: ['PHASE3_CONTRACT_ACTIVE'] }),
      } as never,
    );

    const prep = svc.prep('mtg_2026_08', 'user_board');
    expect(prep).not.toBeNull();
    expect(prep!.phase).toBe(21);
    expect(prep!.items.length).toBeGreaterThan(0);
    const first = prep!.items[0]!;
    expect(first.application?.status).not.toBe('DRAFT');
    expect(first.privateNoteCount).toBe(1);
    expect(first.similar.every((s) => s.applicationId !== 'app_sample_pending')).toBe(true);
    expect(JSON.stringify(prep)).not.toContain('AI DRAFT');
    expect(JSON.stringify(prep)).not.toContain('private scratch');
    expect(prep!.disclaimer).toContain('AS 44.62.310');
  });

  it('returns null for unknown meetings', () => {
    const svc = new MeetingPrepService(
      { similarApplications: () => ({ results: [] }) } as never,
      { listNotes: () => [] } as never,
      { status: () => ({ active: false }) } as never,
    );
    expect(svc.prep('nope', 'user_board')).toBeNull();
  });
});
