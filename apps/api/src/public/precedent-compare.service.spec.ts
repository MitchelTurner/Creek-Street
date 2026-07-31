import { describe, expect, it } from 'vitest';
import { PrecedentCompareService } from './precedent-compare.service';

describe('PrecedentCompareService', () => {
  const svc = new PrecedentCompareService();

  it('compares sign proposed vs as-built under the same criterion', () => {
    const row = svc.compare('ex_sign_proposed', 'ex_sign_after');
    expect(row.left.id).toBe('ex_sign_proposed');
    expect(row.right.id).toBe('ex_sign_after');
    expect(row.analysis.sameCriterion).toBe('MATERIAL_HONESTY');
    expect(row.analysis.sameDecision).toBe(true);
    expect(row.analysis.teachingPrompt).toMatch(/MATERIAL HONESTY/i);
  });

  it('404s unknown exemplars', () => {
    expect(() => svc.compare('missing', 'ex_sign_after')).toThrow(/not found/i);
  });
});
