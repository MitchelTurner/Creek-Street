import { describe, expect, it } from 'vitest';
import { StructureSheetService } from './structure-sheet.service';

describe('StructureSheetService', () => {
  const svc = new StructureSheetService();

  it('assembles a civic dossier for 20 Creek Street', () => {
    const sheet = svc.sheet('20-creek-street');
    expect(sheet).not.toBeNull();
    expect(sheet!.phase).toBe(30);
    expect(sheet!.applications.some((a) => a.id === 'app_sample_sign')).toBe(true);
    expect(sheet!.decisions.some((d) => d.id === 'dec_sample_1')).toBe(true);
    expect(sheet!.precedents.some((p) => p.id === 'ex_sign_proposed')).toBe(true);
    expect(sheet!.criteria.some((c) => c.key === 'MATERIAL_HONESTY')).toBe(true);
    expect(sheet!.meetings.some((m) => m.id === 'mtg_2023_04')).toBe(true);
    expect(JSON.stringify(sheet)).not.toContain('app_sample_draft');
    expect(JSON.stringify(sheet)).not.toContain('must never be public');
  });

  it('covers awning structure and pending structure', () => {
    const awning = svc.sheet('10-creek-street');
    expect(awning!.decisions.some((d) => d.id === 'dec_sample_2')).toBe(true);

    const pending = svc.sheet('13-creek-street');
    expect(pending!.applications.some((a) => a.id === 'app_sample_pending')).toBe(true);
    expect(pending!.decisions).toHaveLength(0);
  });

  it('filters DRAFT apps on structures that only have drafts', () => {
    const star = svc.sheet('star-house');
    expect(star).not.toBeNull();
    expect(star!.applications).toHaveLength(0);
    expect(JSON.stringify(star)).not.toContain('app_sample_draft');
  });

  it('returns null for unknown slugs', () => {
    expect(svc.sheet('not-a-structure')).toBeNull();
  });

  it('builds a PDF buffer', async () => {
    const buf = await svc.buildPdf('20-creek-street');
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf!.length).toBeGreaterThan(200);
    expect(await svc.buildPdf('not-a-structure')).toBeNull();
  });
});
