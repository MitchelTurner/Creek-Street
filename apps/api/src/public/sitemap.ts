import { applications, meetings, structures } from '../data/phase0-seed';
import { PUBLIC_STATUS_SET } from '../store/public-statuses';

const STATIC_PATHS = [
  '/',
  '/search',
  '/visit',
  '/map',
  '/structures',
  '/docket',
  '/decisions',
  '/meetings',
  '/guidance',
  '/board',
  '/opendata',
  '/triage',
  '/permits',
  '/precedents',
  '/notice',
  '/timelines',
  '/photos',
  '/construction',
  '/compliance',
];

/** Public sitemap paths only — never workspace/official/admin/auth. */
export function publicSitemapPaths() {
  const structurePaths = structures.map((s) => `/structures/${s.publicSlug}`);
  const visitPaths = structures
    .filter((s) => s.nrhpContributing)
    .map((s) => `/visit/${s.publicSlug}`);
  const heldOutcomes = meetings
    .filter((m) => m.status === 'HELD')
    .map((m) => `/meetings/${m.id}/outcomes`);
  const caseBriefs = applications
    .filter((a) => PUBLIC_STATUS_SET.has(a.status))
    .map((a) => `/docket/${a.id}`);
  return [...STATIC_PATHS, ...structurePaths, ...visitPaths, ...heldOutcomes, ...caseBriefs];
}

export function renderSitemapXml(origin: string) {
  const base = origin.replace(/\/$/, '');
  const urls = publicSitemapPaths()
    .map(
      (path) =>
        `<url><loc>${escapeXml(base + (path === '/' ? '/' : path))}</loc><changefreq>weekly</changefreq></url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
