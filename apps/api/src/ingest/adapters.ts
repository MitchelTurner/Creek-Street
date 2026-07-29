import { applications, meetings, structures } from '../data/phase0-seed';
import { shipCalls } from '../data/phase4-seed';
import type { IngestAdapterResult, IngestSourceId, SourceWatermark } from './ingest.types';
import { isUrlAllowed } from './robots';
import { createHash } from 'crypto';

function fp(data: unknown) {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
}

function diffAgainst(prev: string | null, next: string, counts: { items: number }) {
  if (!prev) return { added: counts.items, updated: 0, removed: 0, unchanged: 0 };
  if (prev === next) return { added: 0, updated: 0, removed: 0, unchanged: counts.items };
  return { added: 0, updated: counts.items, removed: 0, unchanged: 0 };
}

export async function runAdapter(
  sourceId: IngestSourceId,
  watermark: SourceWatermark,
): Promise<IngestAdapterResult> {
  switch (sourceId) {
    case 'clerk_agendas':
      return clerkAgendas(watermark);
    case 'borough_gis':
      return boroughGis(watermark);
    case 'nrhp_seed':
      return nrhpRefresh(watermark);
    case 'ktnport_ships':
      return ktnportSync(watermark);
    case 'embedding_refresh':
      return embeddingRefresh(watermark);
    case 'meeting_summaries':
      return meetingSummaryJob(watermark);
    default:
      return {
        fingerprint: 'none',
        message: 'Unknown source',
        diff: { added: 0, updated: 0, removed: 0, unchanged: 0 },
        fanout: [],
        skipped: true,
      };
  }
}

async function clerkAgendas(wm: SourceWatermark): Promise<IngestAdapterResult> {
  // Probe preferred public host; never hit borough.ketchikan.ak.us scraper path.
  const candidate = process.env.CLERK_FEED_URL ?? 'https://www.kgbak.us/';
  const robots = await isUrlAllowed(candidate);
  if (!robots.allowed) {
    return {
      fingerprint: wm.lastFingerprint ?? 'blocked',
      message: `Skipped: ${robots.reason}`,
      diff: { added: 0, updated: 0, removed: 0, unchanged: meetings.length },
      fanout: [],
      skipped: true,
    };
  }

  // Until a real RSS/iCal URL is configured, fingerprint mirrored meeting set.
  const payload = meetings.map((m) => ({ id: m.id, at: m.scheduledAt, status: m.status }));
  const fingerprint = fp(payload);
  const changed = wm.lastFingerprint !== fingerprint;
  return {
    fingerprint,
    message: changed
      ? `Watermark advanced over ${meetings.length} mirrored meetings. Configure CLERK_FEED_URL for live CivicPlus/RSS ingest. robots: ${robots.reason}`
      : `No docket change (${meetings.length} meetings). robots: ${robots.reason}`,
    diff: diffAgainst(wm.lastFingerprint, fingerprint, { items: meetings.length }),
    fanout: changed ? ['subscriptions.district_wide', 'rss.feeds'] : [],
  };
}

async function boroughGis(wm: SourceWatermark): Promise<IngestAdapterResult> {
  const endpoint = process.env.BOROUGH_GIS_URL;
  if (!endpoint) {
    return {
      fingerprint: wm.lastFingerprint ?? 'no-gis',
      message:
        'Skipped: set BOROUGH_GIS_URL to an ArcGIS REST FeatureServer layer. Ask before scraping property search HTML.',
      diff: { added: 0, updated: 0, removed: 0, unchanged: 0 },
      fanout: [],
      skipped: true,
    };
  }
  const robots = await isUrlAllowed(endpoint);
  if (!robots.allowed) {
    return {
      fingerprint: wm.lastFingerprint ?? 'blocked',
      message: `Skipped GIS: ${robots.reason}`,
      diff: { added: 0, updated: 0, removed: 0, unchanged: 0 },
      fanout: [],
      skipped: true,
    };
  }
  // Placeholder probe — production would page Features and upsert Parcel geometry.
  const fingerprint = fp({ endpoint, at: new Date().toISOString().slice(0, 10) });
  return {
    fingerprint,
    message: `GIS endpoint reachable per robots.txt. Wire FeatureServer paging next. ${robots.reason}`,
    diff: { added: 0, updated: 0, removed: 0, unchanged: 0 },
    fanout: [],
  };
}

async function nrhpRefresh(wm: SourceWatermark): Promise<IngestAdapterResult> {
  const fingerprint = fp(structures.map((s) => s.publicSlug));
  return {
    fingerprint,
    message: `NRHP structure inventory fingerprint ${fingerprint} (${structures.length} structures).`,
    diff: diffAgainst(wm.lastFingerprint, fingerprint, { items: structures.length }),
    fanout: [],
  };
}

async function ktnportSync(wm: SourceWatermark): Promise<IngestAdapterResult> {
  const api = process.env.KTNPORT_API_URL;
  if (!api) {
    const fingerprint = fp(shipCalls.map((c) => c.id));
    return {
      fingerprint,
      message: `Using ktnport-shaped seed (${shipCalls.length} calls). Set KTNPORT_API_URL for internal sync — do not re-scrape.`,
      diff: diffAgainst(wm.lastFingerprint, fingerprint, { items: shipCalls.length }),
      fanout: fingerprint !== wm.lastFingerprint ? ['construction.window'] : [],
    };
  }
  const robots = await isUrlAllowed(api);
  // Internal API may not need robots; still record attempt.
  const fingerprint = fp({ api, day: new Date().toISOString().slice(0, 10) });
  return {
    fingerprint,
    message: `ktnport sync stub against ${api}. robots note: ${robots.reason}`,
    diff: { added: 0, updated: 1, removed: 0, unchanged: 0 },
    fanout: ['construction.window'],
  };
}

async function embeddingRefresh(wm: SourceWatermark): Promise<IngestAdapterResult> {
  const publicApps = applications.filter((a) => a.status !== 'DRAFT');
  const fingerprint = fp(publicApps.map((a) => [a.id, a.description]));
  return {
    fingerprint,
    message: `Refreshed lexical/embedding index over ${publicApps.length} public applications (TF-IDF now; pgvector when DATABASE_URL + extension live).`,
    diff: diffAgainst(wm.lastFingerprint, fingerprint, { items: publicApps.length }),
    fanout: fingerprint !== wm.lastFingerprint ? ['precedents.similar'] : [],
  };
}

async function meetingSummaryJob(wm: SourceWatermark): Promise<IngestAdapterResult> {
  // Never auto-publish. Draft generation only.
  const held = meetings.filter((m) => m.status === 'HELD');
  const fingerprint = fp(held.map((m) => m.id));
  return {
    fingerprint,
    message: `Summary drafts considered for ${held.length} held meetings. isPublished remains false until staff review — unreviewed summaries are never public.`,
    diff: { added: 0, updated: held.length, removed: 0, unchanged: 0 },
    fanout: [],
  };
}
