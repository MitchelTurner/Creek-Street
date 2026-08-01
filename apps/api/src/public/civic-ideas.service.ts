import { Injectable } from '@nestjs/common';
import {
  civicIdeas,
  ideaPillars,
  type CivicIdea,
  type IdeaPillar,
} from '../data/civic-ideas-seed';

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, rows: T[]): T {
  return rows[Math.floor(rng() * rows.length)]!;
}

function shuffle<T>(rng: () => number, rows: T[]): T[] {
  const out = [...rows];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

@Injectable()
export class CivicIdeasService {
  catalog() {
    return {
      phase: 34,
      pillars: ideaPillars,
      ideas: civicIdeas,
      count: civicIdeas.length,
      disclaimer:
        'Independent civic brainstorming for Creek Street / Ketchikan Gateway Borough. Not borough policy, not a filing, and not legal advice. Confirm every action with the Zoning Administrator and elected bodies.',
    };
  }

  generate(opts?: { seed?: string; focus?: string; count?: number }) {
    const seed = (opts?.seed?.trim() || `${Date.now()}`).slice(0, 80);
    const rng = mulberry32(hashSeed(seed));
    const focus = (opts?.focus?.toUpperCase() || 'ALL') as IdeaPillar | 'ALL';
    const perPillar = Math.min(Math.max(opts?.count ?? 1, 1), 3);

    const byPillar = (pillar: IdeaPillar) =>
      shuffle(
        rng,
        civicIdeas.filter((i) => i.pillar === pillar),
      ).slice(0, perPillar);

    const culture = byPillar('CULTURE');
    const business = byPillar('BUSINESS');
    const revenue = byPillar('REVENUE');

    let spotlight: CivicIdea[];
    if (focus === 'CULTURE' || focus === 'BUSINESS' || focus === 'REVENUE') {
      spotlight = shuffle(
        rng,
        civicIdeas.filter((i) => i.pillar === focus),
      ).slice(0, 3);
    } else {
      spotlight = [pick(rng, culture), pick(rng, business), pick(rng, revenue)];
    }

    const comboTitle = `${spotlight[0]!.title.split(' ').slice(0, 3).join(' ')} × ${spotlight[1]!.title.split(' ').slice(0, 3).join(' ')}`;

    return {
      phase: 34,
      seed,
      focus,
      generatedAt: new Date().toISOString(),
      headline: comboTitle,
      lede: 'A Creek Street brief that braids culture preservation, local business, and public revenue — grounded in the Historic District’s boardwalk reality.',
      pillars: {
        CULTURE: culture,
        BUSINESS: business,
        REVENUE: revenue,
      },
      spotlight,
      playbook: [
        'Stress-test the exterior scope in triage before promising a storefront or sign package.',
        'Use the filing pathway to sequence permits, HD notice, and file-by timing against cruise season.',
        'Keep interpretation and sponsorship off the primary façade unless design review supports it.',
        'Confirm fee schedules and temporary-use rules with City / Borough staff — this hub is not the clerk.',
      ],
      links: {
        triage: '/triage',
        filing: '/filing',
        map: '/map',
        visit: '/visit',
        opendata: '/opendata',
      },
      disclaimer:
        'Independent ideation aid operated by Mitchel Turner Dev, LLC — not a borough property. Not an official City of Ketchikan or Ketchikan Gateway Borough plan.',
    };
  }
}
