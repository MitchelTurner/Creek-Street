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
});
