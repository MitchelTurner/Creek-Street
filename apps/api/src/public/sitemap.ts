import { applications, criteria, decisions, meetings, structures } from '../data/phase0-seed';
import { meetingSummaries } from '../data/phase4-seed';
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
  '/filing',
  '/ideas',
  '/permits',
  '/precedents',
  '/precedents/compare',
  '/notice',
  '/notice/packet',
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
  const meetingPages = meetings.map((m) => `/meetings/${m.id}`);
  const heldOutcomes = meetings
    .filter((m) => m.status === 'HELD')
    .map((m) => `/meetings/${m.id}/outcomes`);
  const publishedSummaries = meetingSummaries
    .filter((s) => s.isPublished && s.reviewedAt)
    .map((s) => `/meetings/${s.meetingId}/summary`);
  const caseBriefs = applications
    .filter((a) => PUBLIC_STATUS_SET.has(a.status))
    .map((a) => `/docket/${a.id}`);
  const decisionSheets = decisions
    .filter((d) => {
      const app = applications.find((a) => a.id === d.applicationId);
      return app != null && PUBLIC_STATUS_SET.has(app.status);
    })
    .map((d) => `/decisions/${d.id}`);
  const criterionPages = criteria.map((c) => `/guidance/criteria/${c.key}`);
  return [
    ...STATIC_PATHS,
    ...structurePaths,
    ...visitPaths,
    ...meetingPages,
    ...heldOutcomes,
    ...publishedSummaries,
    ...caseBriefs,
    ...decisionSheets,
    ...criterionPages,
  ];
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
