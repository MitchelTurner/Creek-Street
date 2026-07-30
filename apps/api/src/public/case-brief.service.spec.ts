import { describe, expect, it } from 'vitest';
import { CaseBriefService } from './case-brief.service';

describe('CaseBriefService', () => {
  const svc = new CaseBriefService();

  it('assembles a public case brief with decisions and HELD outcomes links', () => {
    const brief = svc.brief('app_sample_sign');
    expect(brief).not.toBeNull();
    expect(brief!.phase).toBe(24);
    expect(brief!.application.caseNumber).toBe('HDR-SAMPLE-001');
    expect(brief!.decisions[0]?.voteFor).toBe(4);
    expect(brief!.meetings.some((m) => m.id === 'mtg_2023_04' && m.outcomes)).toBe(true);
    expect(brief!.links.ui).toBe('/docket/app_sample_sign');
    expect(JSON.stringify(brief)).not.toContain('app_sample_draft');
    expect(JSON.stringify(brief)).not.toContain('must never be public');
  });

  it('lists scheduled meetings without outcomes links', () => {
    const brief = svc.brief('app_sample_pending');
    expect(brief).not.toBeNull();
    expect(brief!.decisions).toHaveLength(0);
    const scheduled = brief!.meetings.find((m) => m.id === 'mtg_2026_08');
    expect(scheduled?.status).toBe('SCHEDULED');
    expect(scheduled?.outcomes).toBeNull();
  });

  it('returns null for DRAFT and unknown ids', () => {
    expect(svc.brief('app_sample_draft')).toBeNull();
    expect(svc.brief('nope')).toBeNull();
  });

  it('builds a PDF buffer for a public case', async () => {
    const buf = await svc.buildPdf('app_sample_sign');
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf!.length).toBeGreaterThan(200);
    expect(await svc.buildPdf('app_sample_draft')).toBeNull();
  });
});
