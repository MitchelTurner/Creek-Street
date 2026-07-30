import { describe, expect, it } from 'vitest';
import { SearchService } from './search.service';

describe('SearchService', () => {
  const search = new SearchService();

  it('returns empty for short queries', () => {
    expect(search.search('a').hits).toEqual([]);
  });

  it('finds structures and never returns DRAFT applications', () => {
    const res = search.search('creek');
    expect(res.hits.length).toBeGreaterThan(0);
    expect(res.hits.some((h) => h.type === 'structure')).toBe(true);
    expect(res.hits.every((h) => h.type !== 'application' || !h.title.includes('draft'))).toBe(
      true,
    );
    // Explicit: seed DRAFT app description must not appear
    expect(res.hits.every((h) => !h.snippet.toLowerCase().includes('must never be public'))).toBe(
      true,
    );
  });

  it('finds guidance / criteria by code cite fragments', () => {
    const res = search.search('uniformity');
    expect(res.hits.some((h) => h.type === 'criterion' || h.type === 'guidance')).toBe(true);
  });

  it('deep-links public applications to case briefs', () => {
    const res = search.search('HDR-SAMPLE-001');
    const appHit = res.hits.find((h) => h.type === 'application' && h.id === 'app_sample_sign');
    expect(appHit?.href).toBe('/docket/app_sample_sign');
  });

  it('deep-links meetings to agenda pages', () => {
    const res = search.search('Assembly Chambers');
    const hit = res.hits.find((h) => h.type === 'meeting' && h.id === 'mtg_2026_08');
    expect(hit?.href).toBe('/meetings/mtg_2026_08');
  });

  it('deep-links decisions to decision sheets', () => {
    const res = search.search('wood substrate');
    const hit = res.hits.find((h) => h.type === 'decision' && h.id === 'dec_sample_1');
    expect(hit?.href).toBe('/decisions/dec_sample_1');
  });
});
