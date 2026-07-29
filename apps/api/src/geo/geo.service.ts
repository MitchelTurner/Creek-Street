import { Injectable, Logger } from '@nestjs/common';
import { applications, parcels } from '../data/phase0-seed';
import { PrismaService } from '../prisma/prisma.service';
import {
  NOTICE_RADIUS_CITY_FEET,
  NOTICE_RADIUS_CITY_METERS,
} from '../phase2/phase2.constants';
import { centroidOf, FEET_PER_METER, haversineMeters } from './geo.math';

export type NoticedParcel = {
  id: string;
  parcelNumber: string;
  address: string | null;
  meters: number;
  feet: number;
};

@Injectable()
export class GeoService {
  private readonly log = new Logger(GeoService.name);
  private postgisLive: boolean | null = null;
  private pgvectorLive: boolean | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async status() {
    const extensions = await this.probeExtensions();
    return {
      prismaEnabled: this.prisma.enabled,
      postgis: extensions.postgis,
      pgvector: extensions.pgvector,
      noticeMethod: extensions.postgis ? 'postgis-st_dwithin' : 'centroid-haversine-approx',
      noticeRadiusFeet: NOTICE_RADIUS_CITY_FEET,
      noticeRadiusMeters: NOTICE_RADIUS_CITY_METERS,
      sqlHelpers: 'apps/api/src/geo/postgis.sql',
    };
  }

  async probeExtensions() {
    if (!this.prisma.enabled) {
      this.postgisLive = false;
      this.pgvectorLive = false;
      return { postgis: false, pgvector: false };
    }
    if (this.postgisLive != null && this.pgvectorLive != null) {
      return { postgis: this.postgisLive, pgvector: this.pgvectorLive };
    }
    try {
      const rows = await this.prisma.rawQuery<{ extname: string }>(
        `SELECT extname FROM pg_extension WHERE extname IN ('postgis', 'vector')`,
      );
      const names = new Set(rows.map((r) => r.extname));
      this.postgisLive = names.has('postgis');
      this.pgvectorLive = names.has('vector');
    } catch (e) {
      this.log.warn(`Extension probe failed: ${(e as Error).message}`);
      this.postgisLive = false;
      this.pgvectorLive = false;
    }
    return { postgis: Boolean(this.postgisLive), pgvector: Boolean(this.pgvectorLive) };
  }

  resolveSubjectParcel(opts: { address?: string; parcelId?: string; applicationId?: string }) {
    let centerParcel = opts.parcelId ? parcels.find((p) => p.id === opts.parcelId) : undefined;

    if (!centerParcel && opts.address) {
      const q = opts.address.toLowerCase();
      centerParcel = parcels.find(
        (p) => p.address.toLowerCase().includes(q) || p.parcelNumber.toLowerCase().includes(q),
      );
    }

    if (!centerParcel && opts.applicationId) {
      const app = applications.find((a) => a.id === opts.applicationId);
      if (app) centerParcel = parcels.find((p) => p.id === app.parcelId);
    }

    return centerParcel ?? null;
  }

  /** Prefer PostGIS ST_DWithin; fall back to centroid haversine over seed parcels. */
  async parcelsWithinNotice(subjectParcelId: string, meters = NOTICE_RADIUS_CITY_METERS) {
    const ext = await this.probeExtensions();
    if (ext.postgis && this.prisma.enabled) {
      try {
        const rows = await this.prisma.rawQuery<{
          id: string;
          parcelNumber: string;
          address: string | null;
          meters_away: number;
        }>(`SELECT * FROM creek_parcels_within_meters($1, $2)`, [subjectParcelId, meters]);
        if (rows.length || (await this.parcelHasGeom(subjectParcelId))) {
          const subject = parcels.find((p) => p.id === subjectParcelId);
          const mapped: NoticedParcel[] = rows.map((r) => ({
            id: r.id,
            parcelNumber: r.parcelNumber,
            address: r.address,
            meters: Math.round(Number(r.meters_away)),
            feet: Math.round(Number(r.meters_away) * FEET_PER_METER),
          }));
          if (subject && !mapped.some((m) => m.id === subject.id)) {
            mapped.unshift({
              id: subject.id,
              parcelNumber: subject.parcelNumber,
              address: subject.address,
              meters: 0,
              feet: 0,
            });
          }
          return { method: 'postgis-st_dwithin' as const, parcels: mapped };
        }
      } catch (e) {
        this.log.warn(`PostGIS notice query failed; using haversine. ${(e as Error).message}`);
      }
    }
    return this.haversineNotice(subjectParcelId, meters);
  }

  private async parcelHasGeom(parcelId: string) {
    const rows = await this.prisma.rawQuery<{ ok: boolean }>(
      `SELECT (geom IS NOT NULL) AS ok FROM "Parcel" WHERE id = $1`,
      [parcelId],
    );
    return Boolean(rows[0]?.ok);
  }

  haversineNotice(subjectParcelId: string, meters = NOTICE_RADIUS_CITY_METERS) {
    const subject = parcels.find((p) => p.id === subjectParcelId);
    if (!subject) {
      return { method: 'centroid-haversine-approx' as const, parcels: [] as NoticedParcel[] };
    }
    const center = centroidOf(subject.geometry);
    const noticed = parcels
      .map((p) => {
        const m = haversineMeters(center, centroidOf(p.geometry));
        return { parcel: p, meters: m };
      })
      .filter((x) => x.meters <= meters)
      .sort((a, b) => a.meters - b.meters)
      .map(
        (x): NoticedParcel => ({
          id: x.parcel.id,
          parcelNumber: x.parcel.parcelNumber,
          address: x.parcel.address,
          meters: Math.round(x.meters),
          feet: Math.round(x.meters * FEET_PER_METER),
        }),
      );
    return { method: 'centroid-haversine-approx' as const, parcels: noticed };
  }

  /** Dense float vectors for pgvector path; TF-IDF lexical remains default similarity. */
  async similarByPgvector(queryVec: number[], limit = 5) {
    const ext = await this.probeExtensions();
    if (!ext.pgvector || !this.prisma.enabled || !queryVec.length) {
      return { method: 'unavailable' as const, rows: [] as Array<{ applicationId: string; distance: number }> };
    }
    const literal = `[${queryVec.map((n) => Number(n).toFixed(8)).join(',')}]`;
    try {
      const rows = await this.prisma.rawQuery<{ application_id: string; distance: number }>(
        `SELECT * FROM creek_similar_applications($1::vector, $2)`,
        [literal, limit],
      );
      return {
        method: 'pgvector-cosine' as const,
        rows: rows.map((r) => ({
          applicationId: r.application_id,
          distance: Number(r.distance),
        })),
      };
    } catch (e) {
      this.log.warn(`pgvector similarity failed: ${(e as Error).message}`);
      return { method: 'unavailable' as const, rows: [] };
    }
  }
}
