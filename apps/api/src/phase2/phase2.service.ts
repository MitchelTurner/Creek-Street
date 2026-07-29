import { Injectable } from '@nestjs/common';
import { applications, decisions, parcels, structures } from '../data/phase0-seed';
import { GeoService } from '../geo/geo.service';
import { Phase1Service } from '../phase1/phase1.service';
import { ApplicantStore } from './applicant.store';
import { PdfService } from './pdf.service';
import {
  NOTICE_RADIUS_CITY_FEET,
  NOTICE_RADIUS_CITY_METERS,
  NOTICE_RADIUS_OUTSIDE_CITY_FEET,
} from './phase2.constants';

export {
  NOTICE_RADIUS_CITY_FEET,
  NOTICE_RADIUS_CITY_METERS,
  NOTICE_RADIUS_OUTSIDE_CITY_FEET,
} from './phase2.constants';

@Injectable()
export class Phase2Service {
  constructor(
    private readonly store: ApplicantStore,
    private readonly pdf: PdfService,
    private readonly phase1: Phase1Service,
    private readonly geo: GeoService,
  ) {}

  disclaimer() {
    return {
      short:
        'This is a preparation tool. Official submission is to the Borough Planning Department.',
      long: 'Creek Street Design Review Hub is operated by Mitchel Turner Dev, LLC and is not a borough property. Drafts and uploads here are your private preparation materials, not board records. Confirm every requirement with the Zoning Administrator before filing.',
    };
  }

  noticeConfig() {
    return {
      hdDesignReview: {
        cite: 'KGBC 18.90.020',
        rule:
          'After filing, the zoning clerk sends notice to owners of record of real property within the HD district (district-wide), not a fixed radius.',
        radiusFeet: null,
      },
      planningCommissionStyle: {
        cite: 'KGBC 18.90.060',
        rule:
          'For actions using 18.90.060 mail notice: 600 feet from the outside perimeter inside the City of Ketchikan; 1,200 feet outside city limits.',
        cityRadiusFeet: NOTICE_RADIUS_CITY_FEET,
        outsideCityRadiusFeet: NOTICE_RADIUS_OUTSIDE_CITY_FEET,
        creekStreetAssumption: 'Creek Street is inside city limits → 600 ft applies for 18.90.060-style notice.',
      },
      sourceUrl: 'https://ketchikangateway.borough.codes/KGBC/18.90.060',
    };
  }

  /** PostGIS ST_DWithin when extensions live; otherwise centroid haversine. */
  async noticeLookup(opts: { address?: string; parcelId?: string; applicationId?: string }) {
    const config = this.noticeConfig();
    const centerParcel = this.geo.resolveSubjectParcel(opts);

    if (!centerParcel) {
      return {
        found: false,
        message: 'Parcel not found. Try an HD zone address (e.g. "24 Creek Street") or parcel id.',
        config,
      };
    }

    const radiusM = NOTICE_RADIUS_CITY_METERS;
    const noticed = await this.geo.parcelsWithinNotice(centerParcel.id, radiusM);

    const pendingApps = applications.filter((a) =>
      ['FILED', 'SCHEDULED', 'BOARD_REVIEWED', 'FORWARDED'].includes(a.status),
    );

    const noticedIds = new Set(noticed.parcels.map((p) => p.id));
    const wouldNoticeYou = pendingApps
      .map((app) => {
        const p = parcels.find((x) => x.id === app.parcelId);
        if (!p) return null;
        const hit = noticed.parcels.find((n) => n.id === p.id);
        const meters = hit?.meters ?? null;
        return {
          application: app,
          parcel: p,
          meters,
          within600ft: noticedIds.has(p.id) || p.id === centerParcel.id,
          hdDistrictNotice: p.inHdZone && centerParcel.inHdZone,
        };
      })
      .filter(Boolean);

    return {
      found: true,
      method: noticed.method,
      note:
        noticed.method === 'postgis-st_dwithin'
          ? 'Distances from PostGIS geography ST_DWithin over parcel polygons (KGBC 18.90.060 city radius).'
          : 'Approximate centroid-to-centroid haversine until PostGIS helpers are applied (see apps/api/src/geo/postgis.sql).',
      subjectParcel: centerParcel,
      radiusFeet: NOTICE_RADIUS_CITY_FEET,
      radiusMeters: radiusM,
      config,
      noticedParcelSet: noticed.parcels,
      pendingApplicationsThatWouldNoticeAddress: wouldNoticeYou,
    };
  }

  timelineExpectations() {
    const MIN_N = 5;
    const byType = new Map<string, number[]>();

    for (const app of applications) {
      if (!app.filedAt) continue;
      const dec = decisions
        .filter((d) => d.applicationId === app.id && d.decidedAt)
        .sort((a, b) => (a.decidedAt ?? '').localeCompare(b.decidedAt ?? ''))[0];
      if (!dec?.decidedAt) continue;
      const days =
        (Date.parse(dec.decidedAt) - Date.parse(app.filedAt)) / (1000 * 60 * 60 * 24);
      if (!Number.isFinite(days) || days < 0) continue;
      const list = byType.get(app.projectType) ?? [];
      list.push(days);
      byType.set(app.projectType, list);
    }

    const buckets = [...byType.entries()].map(([projectType, days]) => {
      const n = days.length;
      if (n < MIN_N) {
        return {
          projectType,
          n,
          suppressed: true,
          reason: `Sample size ${n} < ${MIN_N}; statistic withheld.`,
        };
      }
      const sorted = [...days].sort((a, b) => a - b);
      return {
        projectType,
        n,
        suppressed: false,
        medianDays: quantile(sorted, 0.5),
        p25Days: quantile(sorted, 0.25),
        p75Days: quantile(sorted, 0.75),
        label: 'Filing → board recommendation (mirrored sample)',
      };
    });

    return {
      minSampleSize: MIN_N,
      disclaimer:
        'Derived from mirrored public records. Not a promise. Buckets with n < 5 are suppressed.',
      buckets,
      overall: (() => {
        const all = [...byType.values()].flat();
        if (all.length < MIN_N) {
          return { n: all.length, suppressed: true as const, reason: `Overall n=${all.length} < ${MIN_N}` };
        }
        const sorted = [...all].sort((a, b) => a - b);
        return {
          n: all.length,
          suppressed: false as const,
          medianDays: quantile(sorted, 0.5),
          p25Days: quantile(sorted, 0.25),
          p75Days: quantile(sorted, 0.75),
        };
      })(),
    };
  }

  async buildDraftPdf(userId: string, draftId: string) {
    const draft = this.store.getDraft(userId, draftId);
    if (!draft) return null;

    const parcel = draft.parcelId ? parcels.find((p) => p.id === draft.parcelId) : null;
    const structure = draft.structureId
      ? structures.find((s) => s.id === draft.structureId)
      : null;

    const permits = this.phase1.matchPermitTriggers({
      inHdZone: true,
      exteriorChange: true,
      includeUnverified: false,
    });

    const buffer = await this.pdf.buildSubmittalPackage({
      applicantName: draft.applicantName,
      projectType: draft.projectType,
      description: draft.description,
      parcelLabel: parcel ? `${parcel.address} (${parcel.parcelNumber})` : '—',
      structureLabel: structure
        ? structure.commonName ?? structure.addressLabel
        : '—',
      triageOutcome: draft.triageOutcome,
      criteria: draft.criteria,
      exhibitsRequired: draft.exhibitsRequired,
      documents: draft.documents.map((d) => ({ kind: d.kind, fileName: d.fileName })),
      agencyNotes: permits.results.map(
        (r) => `${r.agency.shortName}: ${r.permitName} (${r.statutoryCite})`,
      ),
      codeCites: ['KGBC 18.40.010(b)(13)', 'KGBC 18.90.020'],
    });

    return { buffer, draft };
  }
}

function quantile(sorted: number[], q: number) {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1];
  if (next === undefined) return Number(sorted[base].toFixed(1));
  return Number((sorted[base] + rest * (next - sorted[base])).toFixed(1));
}
