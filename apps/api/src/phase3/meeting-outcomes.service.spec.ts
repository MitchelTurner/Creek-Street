import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { MeetingOutcomesService } from './meeting-outcomes.service';

describe('MeetingOutcomesService', () => {
  function makeSvc(summary: unknown = null) {
    return new MeetingOutcomesService(
      {
        publishedSummaryForMeeting: () => summary,
      } as never,
      {
        status: () => ({ active: false, message: 'dark' }),
      } as never,
    );
  }

  it('assembles HELD meeting outcomes with decisions and strips AI summary body', () => {
    const svc = makeSvc({
      id: 'sum_2023_04_published',
      body: 'AI DRAFT SECRET MUST NOT APPEAR',
      perItem: { x: { summary: 'secret', sourceRefs: [] } },
      reviewedAt: '2026-06-02T00:00:00.000Z',
      isPublished: true,
    });

    const out = svc.outcomes('mtg_2023_04');
    expect(out).not.toBeNull();
    expect(out!.phase).toBe(22);
    expect(out!.meeting.status).toBe('HELD');
    expect(out!.items[0]?.application?.caseNumber).toBe('HDR-SAMPLE-001');
    expect(out!.items[0]?.decision?.voteFor).toBe(4);
    expect(out!.summary?.id).toBe('sum_2023_04_published');
    expect(out!.summary).not.toHaveProperty('body');
    expect(out!.summary).not.toHaveProperty('perItem');
    expect(JSON.stringify(out)).not.toContain('AI DRAFT SECRET MUST NOT APPEAR');
    expect(JSON.stringify(out)).not.toContain('app_sample_draft');
  });

  it('rejects SCHEDULED meetings and returns null for unknown ids', () => {
    const svc = makeSvc();
    expect(svc.outcomes('nope')).toBeNull();
    expect(() => svc.outcomes('mtg_2026_08')).toThrow(BadRequestException);
    try {
      svc.outcomes('mtg_2026_08');
    } catch (e) {
      expect((e as BadRequestException).getResponse()).toMatchObject({
        code: 'MEETING_NOT_HELD',
      });
    }
  });

  it('exposes a public view without contract status', () => {
    const pub = makeSvc().publicOutcomes('mtg_2023_04');
    expect(pub).not.toBeNull();
    expect(pub!.phase).toBe(23);
    expect(pub).not.toHaveProperty('contract');
    expect(pub!.links.json).toBe('/api/meetings/mtg_2023_04/outcomes');
    expect(pub!.links.ui).toBe('/meetings/mtg_2023_04/outcomes');
  });
});
