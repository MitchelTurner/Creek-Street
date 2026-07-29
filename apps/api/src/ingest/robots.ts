/**
 * Robots.txt respect for borough domains.
 * Spec: borough.ketchikan.ak.us returns robots-disallowed on automated fetch —
 * do not ignore robots.txt. Prefer kgbak.us feeds or Clerk-provided data.
 */

import robotsParser from 'robots-parser';

const CACHE = new Map<string, { fetchedAt: number; parser: ReturnType<typeof robotsParser> | null }>();
const TTL_MS = 1000 * 60 * 60;

export async function isUrlAllowed(url: string, userAgent = 'CreekStreetHubBot/0.1'): Promise<{
  allowed: boolean;
  reason: string;
}> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { allowed: false, reason: 'Invalid URL' };
  }

  // Hard block known hostile scrape target from the build spec.
  if (parsed.hostname === 'borough.ketchikan.ak.us') {
    return {
      allowed: false,
      reason:
        'borough.ketchikan.ak.us is robots-disallowed for automated fetch. Ask the Clerk or use kgbak.us / CivicPlus feeds.',
    };
  }

  const robotsUrl = `${parsed.origin}/robots.txt`;
  const cached = CACHE.get(robotsUrl);
  let parser = cached && Date.now() - cached.fetchedAt < TTL_MS ? cached.parser : null;

  if (!cached || Date.now() - cached.fetchedAt >= TTL_MS) {
    try {
      const res = await fetch(robotsUrl, {
        headers: { 'User-Agent': userAgent },
        signal: AbortSignal.timeout(8000),
      });
      const body = res.ok ? await res.text() : '';
      parser = robotsParser(robotsUrl, body);
      CACHE.set(robotsUrl, { fetchedAt: Date.now(), parser });
    } catch {
      // Fail closed for government domains when robots.txt cannot be read.
      CACHE.set(robotsUrl, { fetchedAt: Date.now(), parser: null });
      return {
        allowed: false,
        reason: `Could not fetch ${robotsUrl}; failing closed (ask before scraping).`,
      };
    }
  }

  if (!parser) {
    return { allowed: false, reason: 'No robots parser available; failing closed.' };
  }

  const allowed = parser.isAllowed(url, userAgent) !== false;
  return {
    allowed,
    reason: allowed ? 'Allowed by robots.txt' : `Disallowed by robots.txt for ${userAgent}`,
  };
}
