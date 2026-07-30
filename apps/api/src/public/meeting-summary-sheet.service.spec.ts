import { describe, expect, it } from 'vitest';
import { MeetingSummarySheetService } from './meeting-summary-sheet.service';

function makeSvc() {
  return new MeetingSummarySheetService({
    publishedSummaryForMeeting: (meetingId: string) => {
      if (meetingId === 'mtg_2023_04') {
        return {
          id: 'sum_2023_04_published',
          meetingId: 'mtg_2023_04',
          body: 'Board recommended approval with conditions for wood wall sign at 20 Creek Street.',
          perItem: {
            ai_2023_04_1: {
              summary: 'Signage HDR-SAMPLE-001 — recommend approval with material conditions.',
              sourceRefs: ['https://example.test/source'],
            },
          },
          model: 'phase4-stub',
          generatedAt: '2026-06-01T00:00:00.000Z',
          reviewedBy: 'staff@example.com',
          reviewedAt: '2026-06-02T00:00:00.000Z',
          isPublished: true,
        };
      }
      return null;
    },
  } as never);
}

describe('MeetingSummarySheetService', () => {
  it('assembles a published summary sheet with case deep-links', () => {
    const sheet = makeSvc().sheet('mtg_2023_04');
    expect(sheet).not.toBeNull();
    expect(sheet!.phase).toBe(27);
    expect(sheet!.humanReviewed).toBe(true);
    expect(sheet!.summary.id).toBe('sum_2023_04_published');
    expect(sheet!.summary.body).toContain('wood wall sign');
    expect(sheet!.items[0]?.application?.caseBriefUi).toBe('/docket/app_sample_sign');
    expect(sheet!.items[0]?.itemSummary?.text).toContain('HDR-SAMPLE-001');
    expect(sheet!.links.ui).toBe('/meetings/mtg_2023_04/summary');
    expect(JSON.stringify(sheet)).not.toContain('app_sample_draft');
  });

  it('returns null for unpublished / missing summaries and unknown meetings', () => {
    const svc = makeSvc();
    expect(svc.sheet('mtg_2024_02')).toBeNull();
    expect(svc.sheet('mtg_2026_08')).toBeNull();
    expect(svc.sheet('nope')).toBeNull();
  });

  it('never exposes unpublished draft summary body via sheet', () => {
    const svc = new MeetingSummarySheetService({
      publishedSummaryForMeeting: () => null,
    } as never);
    expect(svc.sheet('mtg_2024_02')).toBeNull();
    expect(JSON.stringify(svc.sheet('mtg_2024_02'))).not.toContain('AI DRAFT');
  });

  it('builds a PDF for published meetings only', async () => {
    const svc = makeSvc();
    const buf = await svc.buildPdf('mtg_2023_04');
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf!.length).toBeGreaterThan(200);
    expect(await svc.buildPdf('mtg_2024_02')).toBeNull();
  });
});
