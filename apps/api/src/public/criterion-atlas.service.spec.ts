import { describe, expect, it } from 'vitest';
import { CriterionAtlasService } from './criterion-atlas.service';

describe('CriterionAtlasService', () => {
  const svc = new CriterionAtlasService();

  it('lists all criteria with teaching-page links', () => {
    const list = svc.list();
    expect(list.phase).toBe(29);
    expect(list.criteria.map((c) => c.key)).toContain('MATERIAL_HONESTY');
    expect(list.criteria.find((c) => c.key === 'MATERIAL_HONESTY')?.href).toBe(
      '/guidance/criteria/MATERIAL_HONESTY',
    );
  });

  it('assembles MATERIAL_HONESTY with sign decision and exemplars', () => {
    const atlas = svc.atlas('MATERIAL_HONESTY');
    expect(atlas).not.toBeNull();
    expect(atlas!.criterion.label).toContain('material');
    expect(atlas!.decisions.some((d) => d.id === 'dec_sample_1')).toBe(true);
    expect(atlas!.decisions[0]?.application.caseBriefUi).toBe('/docket/app_sample_sign');
    expect(atlas!.precedents.some((p) => p.id === 'ex_sign_proposed')).toBe(true);
    expect(JSON.stringify(atlas)).not.toContain('app_sample_draft');
    expect(JSON.stringify(atlas)).not.toContain('must never be public');
  });

  it('assembles APPROPRIATENESS with awning exemplars', () => {
    const atlas = svc.atlas('APPROPRIATENESS');
    expect(atlas!.decisions.some((d) => d.id === 'dec_sample_2')).toBe(true);
    expect(atlas!.precedents.some((p) => p.id === 'ex_awning_proposed')).toBe(true);
  });

  it('allows empty precedent criteria', () => {
    const atlas = svc.atlas('UNIFORMITY');
    expect(atlas).not.toBeNull();
    expect(atlas!.precedents).toHaveLength(0);
    expect(atlas!.decisions).toHaveLength(0);
  });

  it('returns null for unknown keys', () => {
    expect(svc.atlas('NOT_A_CRITERION')).toBeNull();
  });

  it('builds a PDF buffer', async () => {
    const buf = await svc.buildPdf('MATERIAL_HONESTY');
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf!.length).toBeGreaterThan(200);
    expect(await svc.buildPdf('NOT_A_CRITERION')).toBeNull();
  });
});
