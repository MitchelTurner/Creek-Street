/**
 * Parallel audience track — tourism narratives, photo time-series placeholders,
 * ship calls (mirrored-from-ktnport shape), and unpublished meeting summaries.
 */

export type StructurePhoto = {
  id: string;
  structureId: string;
  storageKey: string;
  photoUrl: string;
  takenAt: string | null;
  yearApprox: number | null;
  isHistoric: boolean;
  credit: string;
  caption: string;
  moderationStatus: 'APPROVED';
};

export const structurePhotos: StructurePhoto[] = [
  {
    id: 'photo_dollys_1905',
    structureId: 'struct_dollys',
    storageKey: 'seed/dollys-historic.svg',
    photoUrl: '/tourism/dollys-historic.svg',
    takenAt: null,
    yearApprox: 1915,
    isHistoric: true,
    credit: 'Illustrative placeholder — replace with moderated historic submission',
    caption: "Dolly's House era — Creek Street boardwalk red-light district period.",
    moderationStatus: 'APPROVED',
  },
  {
    id: 'photo_dollys_today',
    structureId: 'struct_dollys',
    storageKey: 'seed/dollys-today.svg',
    photoUrl: '/tourism/dollys-today.svg',
    takenAt: '2024-07-01T00:00:00.000Z',
    yearApprox: 2024,
    isHistoric: false,
    credit: 'Illustrative placeholder',
    caption: "Dolly's House museum today — contributing structure on the boardwalk.",
    moderationStatus: 'APPROVED',
  },
  {
    id: 'photo_star_historic',
    structureId: 'struct_star',
    storageKey: 'seed/star-historic.svg',
    photoUrl: '/tourism/star-historic.svg',
    takenAt: null,
    yearApprox: 1925,
    isHistoric: true,
    credit: 'Illustrative placeholder',
    caption: 'The Star / Star House after the dance-hall addition era.',
    moderationStatus: 'APPROVED',
  },
  {
    id: 'photo_star_today',
    structureId: 'struct_star',
    storageKey: 'seed/star-today.svg',
    photoUrl: '/tourism/star-today.svg',
    takenAt: '2024-07-01T00:00:00.000Z',
    yearApprox: 2024,
    isHistoric: false,
    credit: 'Illustrative placeholder',
    caption: 'Star House — individually listed NRHP and district contributor.',
    moderationStatus: 'APPROVED',
  },
  {
    id: 'photo_junes',
    structureId: 'struct_junes',
    storageKey: 'seed/junes.svg',
    photoUrl: '/tourism/junes.svg',
    takenAt: null,
    yearApprox: 1920,
    isHistoric: true,
    credit: 'Illustrative placeholder',
    caption: "June's Cafe storefront at Stedman and Creek.",
    moderationStatus: 'APPROVED',
  },
];

/** Illustrative ship-call density for construction-window planning (ktnport-shaped). */
export type ShipCallSeed = {
  id: string;
  callDate: string;
  vesselName: string;
  estimatedPax: number;
  source: string;
};

function summerCalls(year: number): ShipCallSeed[] {
  const vessels = ['Eurodam', 'Radiance of the Seas', 'Norwegian of the Seas', 'Koningsdam', 'Discovery Princess'];
  const rows: ShipCallSeed[] = [];
  // Dense May–Sept pattern (illustrative, not live ktnport)
  for (const month of [5, 6, 7, 8, 9]) {
    for (let day = 1; day <= 28; day += 1) {
      // ~5–6 calls/week mid-summer
      if (day % 2 === 0 || (month >= 6 && month <= 8 && day % 3 !== 0)) {
        const v = vessels[(day + month) % vessels.length];
        rows.push({
          id: `ship_${year}_${month}_${day}_${v}`,
          callDate: new Date(Date.UTC(year, month - 1, day, 12)).toISOString(),
          vesselName: v,
          estimatedPax: 2000 + ((day * 37) % 1500),
          source: 'ktnport-shaped-seed',
        });
      }
    }
  }
  return rows;
}

export const shipCalls: ShipCallSeed[] = [...summerCalls(2026), ...summerCalls(2027)];

export type MeetingSummarySeed = {
  id: string;
  meetingId: string;
  body: string;
  perItem: Record<string, { summary: string; sourceRefs: string[] }>;
  model: string;
  generatedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  isPublished: boolean;
};

/** Unreviewed summaries must never appear on public surfaces. */
export const meetingSummaries: MeetingSummarySeed[] = [
  {
    id: 'sum_2024_02_draft',
    meetingId: 'mtg_2024_02',
    body: 'AI DRAFT — board recommended approval of awning replacement at 10 Creek Street as submitted.',
    perItem: {
      ai_2024_02_1: {
        summary: 'Awning at 10 Creek Street — recommend approval as submitted.',
        sourceRefs: ['minutes-pending'],
      },
    },
    model: 'phase4-stub',
    generatedAt: '2026-07-01T00:00:00.000Z',
    reviewedBy: null,
    reviewedAt: null,
    isPublished: false,
  },
  {
    id: 'sum_2023_04_published',
    meetingId: 'mtg_2023_04',
    body: 'Board recommended approval with conditions for wood wall sign at 20 Creek Street (no internal illumination; wood substrate).',
    perItem: {
      ai_2023_04_1: {
        summary: 'Signage HDR-SAMPLE-001 — recommend approval with material conditions.',
        sourceRefs: ['https://npgallery.nps.gov/AssetDetail/NRIS/14000454'],
      },
    },
    model: 'phase4-stub',
    generatedAt: '2026-06-01T00:00:00.000Z',
    reviewedBy: 'staff@example.com',
    reviewedAt: '2026-06-02T00:00:00.000Z',
    isPublished: true,
  },
];

/** Shoulder / build windows — exterior work realistically outside peak cruise. */
export const buildSeasonDefaults = {
  peakCruiseMonths: [5, 6, 7, 8, 9],
  preferredBuildMonths: [10, 11, 12, 1, 2, 3, 4],
  note: 'Exterior work on Creek Street realistically happens outside peak cruise season. Backward-plan from the build window using mirrored timeline medians — never presented as a promise.',
};
