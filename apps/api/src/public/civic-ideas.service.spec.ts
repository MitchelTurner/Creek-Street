import { describe, expect, it } from 'vitest';
import { CivicIdeasService } from './civic-ideas.service';

describe('CivicIdeasService', () => {
  const svc = new CivicIdeasService();

  it('lists the curated catalog with three pillars', () => {
    const catalog = svc.catalog();
    expect(catalog.pillars).toHaveLength(3);
    expect(catalog.count).toBeGreaterThanOrEqual(12);
    expect(catalog.ideas.every((i) => ['CULTURE', 'BUSINESS', 'REVENUE'].includes(i.pillar))).toBe(
      true,
    );
  });

  it('generates a deterministic brief for the same seed', () => {
    const a = svc.generate({ seed: 'boardwalk-2026', focus: 'ALL' });
    const b = svc.generate({ seed: 'boardwalk-2026', focus: 'ALL' });
    expect(a.spotlight.map((i) => i.id)).toEqual(b.spotlight.map((i) => i.id));
    expect(a.headline).toBe(b.headline);
    expect(a.pillars.CULTURE.length).toBeGreaterThan(0);
    expect(a.pillars.BUSINESS.length).toBeGreaterThan(0);
    expect(a.pillars.REVENUE.length).toBeGreaterThan(0);
  });

  it('can focus a single pillar', () => {
    const row = svc.generate({ seed: 'culture-only', focus: 'CULTURE' });
    expect(row.spotlight.every((i) => i.pillar === 'CULTURE')).toBe(true);
  });
});
