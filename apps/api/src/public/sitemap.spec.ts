import { describe, expect, it } from 'vitest';
import { publicSitemapPaths, renderSitemapXml } from './sitemap';

describe('public sitemap', () => {
  it('includes core public routes and excludes private surfaces', () => {
    const paths = publicSitemapPaths();
    expect(paths).toContain('/');
    expect(paths).toContain('/docket');
    expect(paths).toContain('/docket/app_sample_sign');
    expect(paths).not.toContain('/docket/app_sample_draft');
    expect(paths).toContain('/meetings/mtg_2026_08');
    expect(paths).toContain('/meetings/mtg_2023_04');
    expect(paths).toContain('/visit');
    expect(paths.some((p) => p.startsWith('/structures/'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/workspace'))).toBe(false);
    expect(paths.some((p) => p.startsWith('/official'))).toBe(false);
    expect(paths.some((p) => p.startsWith('/admin'))).toBe(false);
    expect(paths.some((p) => p.startsWith('/auth'))).toBe(false);
  });

  it('renders valid-looking XML with absolute locs', () => {
    const xml = renderSitemapXml('https://example.test');
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('<loc>https://example.test/</loc>');
    expect(xml).toContain('<loc>https://example.test/docket</loc>');
    expect(xml).not.toContain('/workspace');
  });
});
