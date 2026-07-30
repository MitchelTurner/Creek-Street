import { Injectable } from '@nestjs/common';
import {
  applications,
  criteria,
  decisions,
  guidanceSections,
  meetings,
  structures,
} from '../data/phase0-seed';

const PUBLIC_STATUSES = new Set([
  'FILED',
  'SCHEDULED',
  'BOARD_REVIEWED',
  'FORWARDED',
  'APPROVED',
  'APPROVED_W_CONDITIONS',
  'DENIED',
  'WITHDRAWN',
]);

export type SearchHit = {
  type: 'structure' | 'application' | 'decision' | 'meeting' | 'guidance' | 'criterion';
  id: string;
  title: string;
  snippet: string;
  href: string;
  score: number;
};

/**
 * Lightweight lexical search over the public mirror only.
 * Never indexes DRAFT applications or unpublished summaries.
 */
@Injectable()
export class SearchService {
  search(q: string, limit = 20): { q: string; total: number; hits: SearchHit[] } {
    const query = q.trim().toLowerCase();
    if (query.length < 2) {
      return { q: q.trim(), total: 0, hits: [] };
    }
    const terms = query.split(/\s+/).filter(Boolean);
    const hits: SearchHit[] = [];

    for (const s of structures) {
      const hay = [
        s.commonName,
        s.addressLabel,
        s.historicNarrative,
        s.publicSlug,
        s.yearBuilt?.toString(),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const score = scoreText(hay, terms);
      if (score > 0) {
        hits.push({
          type: 'structure',
          id: s.id,
          title: s.commonName ?? s.addressLabel,
          snippet: truncate(s.historicNarrative ?? s.addressLabel),
          href: `/structures/${s.publicSlug}`,
          score,
        });
      }
    }

    for (const a of applications) {
      if (!PUBLIC_STATUSES.has(a.status)) continue;
      const hay = [a.caseNumber, a.applicantName, a.projectType, a.description, a.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const score = scoreText(hay, terms);
      if (score > 0) {
        hits.push({
          type: 'application',
          id: a.id,
          title: a.caseNumber ?? a.id,
          snippet: truncate(`${a.projectType}: ${a.description}`),
          href: `/docket/${a.id}`,
          score: score + 0.1,
        });
      }
    }

    for (const d of decisions) {
      const app = applications.find((a) => a.id === d.applicationId);
      if (app && !PUBLIC_STATUSES.has(app.status)) continue;
      const hay = [d.recommendation, d.conditions, d.finalOutcome, app?.caseNumber, app?.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const score = scoreText(hay, terms);
      if (score > 0) {
        hits.push({
          type: 'decision',
          id: d.id,
          title: app?.caseNumber ? `Decision · ${app.caseNumber}` : `Decision · ${d.id}`,
          snippet: truncate(d.recommendation),
          href: `/decisions/${d.id}`,
          score,
        });
      }
    }

    for (const m of meetings) {
      const hay = [m.location, m.status, m.cancelReason, ...m.agendaItems.map((i) => i.title)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const score = scoreText(hay, terms);
      if (score > 0) {
        hits.push({
          type: 'meeting',
          id: m.id,
          title: `Meeting ${new Date(m.scheduledAt).toLocaleDateString('en-US', { timeZone: 'America/Juneau' })}`,
          snippet: truncate(m.agendaItems.map((i) => i.title).join('; ') || m.location),
          href: `/meetings/${m.id}`,
          score,
        });
      }
    }

    for (const g of guidanceSections) {
      const hay = [g.title, g.plainLanguage, g.codeCite, g.codeText].join(' ').toLowerCase();
      const score = scoreText(hay, terms);
      if (score > 0) {
        hits.push({
          type: 'guidance',
          id: g.id,
          title: g.title,
          snippet: truncate(g.plainLanguage),
          href: `/guidance`,
          score,
        });
      }
    }

    for (const c of criteria) {
      const hay = [c.key, c.label, c.plainLanguage, c.codeCite, c.codeText].join(' ').toLowerCase();
      const score = scoreText(hay, terms);
      if (score > 0) {
        hits.push({
          type: 'criterion',
          id: c.key,
          title: c.label,
          snippet: truncate(c.plainLanguage),
          href: `/guidance`,
          score,
        });
      }
    }

    hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
    const limited = hits.slice(0, Math.min(Math.max(limit, 1), 50));
    return { q: q.trim(), total: hits.length, hits: limited };
  }
}

function scoreText(hay: string, terms: string[]) {
  let score = 0;
  for (const t of terms) {
    if (!hay.includes(t)) return 0;
    score += 1;
    if (hay.startsWith(t)) score += 0.5;
    // Phrase density bonus for short exact matches
    const occurrences = hay.split(t).length - 1;
    score += Math.min(occurrences, 3) * 0.15;
  }
  return score;
}

function truncate(s: string, n = 160) {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}
