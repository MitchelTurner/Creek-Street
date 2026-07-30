import { describe, expect, it } from 'vitest';
import { DecisionSheetService } from './decision-sheet.service';

describe('DecisionSheetService', () => {
  const svc = new DecisionSheetService();

  it('assembles a decision sheet with case, meeting, and precedents', () => {
    const sheet = svc.sheet('dec_sample_1');
    expect(sheet).not.toBeNull();
    expect(sheet!.phase).toBe(28);
    expect(sheet!.application.caseNumber).toBe('HDR-SAMPLE-001');
    expect(sheet!.application.caseBriefUi).toBe('/docket/app_sample_sign');
    expect(sheet!.decision.voteFor).toBe(4);
    expect(sheet!.meeting?.id).toBe('mtg_2023_04');
    expect(sheet!.meeting?.agendaUi).toBe('/meetings/mtg_2023_04');
    expect(sheet!.precedents.some((p) => p.id === 'ex_sign_proposed')).toBe(true);
    expect(sheet!.links.ui).toBe('/decisions/dec_sample_1');
    expect(JSON.stringify(sheet)).not.toContain('app_sample_draft');
    expect(JSON.stringify(sheet)).not.toContain('must never be public');
  });

  it('covers the second sample decision', () => {
    const sheet = svc.sheet('dec_sample_2');
    expect(sheet!.application.caseNumber).toBe('HDR-SAMPLE-002');
    expect(sheet!.meeting?.id).toBe('mtg_2024_02');
    expect(sheet!.precedents.some((p) => p.id === 'ex_awning_proposed')).toBe(true);
  });

  it('returns null for unknown decisions', () => {
    expect(svc.sheet('nope')).toBeNull();
  });

  it('builds a PDF buffer', async () => {
    const buf = await svc.buildPdf('dec_sample_1');
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf!.length).toBeGreaterThan(200);
    expect(await svc.buildPdf('nope')).toBeNull();
  });
});
