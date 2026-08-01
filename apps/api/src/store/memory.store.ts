import { Injectable } from '@nestjs/common';
import {
  applications,
  criteria,
  decisions,
  districtBoundary,
  guidanceSections,
  meetings,
  meta,
  openDataLicense,
  parcels,
  seats,
  structures,
} from '../data/phase0-seed';
import { meetingSummaries, structurePhotos } from '../data/phase4-seed';
import { PUBLIC_STATUS_SET as PUBLIC_STATUSES } from './public-statuses';

@Injectable()
export class MemoryStore {
  meta() {
    return meta;
  }

  license() {
    return openDataLicense;
  }

  listStructures(opts?: { contributing?: boolean }) {
    let rows = structures;
    if (opts?.contributing === true) rows = rows.filter((s) => s.nrhpContributing === true);
    if (opts?.contributing === false) rows = rows.filter((s) => s.nrhpContributing === false);
    return rows.map((s) => this.structureSummary(s));
  }

  getStructureBySlug(slug: string) {
    const s = structures.find((x) => x.publicSlug === slug);
    if (!s) return null;
    const parcel = parcels.find((p) => p.id === s.parcelId) ?? null;
    const apps = applications.filter(
      (a) => a.structureId === s.id && PUBLIC_STATUSES.has(a.status),
    );
    const appIds = new Set(apps.map((a) => a.id));
    const decs = decisions.filter((d) => appIds.has(d.applicationId));
    const photos = structurePhotos
      .filter((p) => p.structureId === s.id && p.moderationStatus === 'APPROVED')
      .sort((a, b) => (a.yearApprox ?? 0) - (b.yearApprox ?? 0));
    return {
      ...s,
      parcel,
      applications: apps,
      decisions: decs,
      photos,
    };
  }

  districtMap() {
    const features = [
      districtBoundary,
      ...structures.map((s) => ({
        type: 'Feature' as const,
        properties: {
          id: s.id,
          publicSlug: s.publicSlug,
          commonName: s.commonName,
          addressLabel: s.addressLabel,
          yearBuilt: s.yearBuilt,
          nrhpContributing: s.nrhpContributing,
          sourceDocUrl: s.sourceDocUrl,
        },
        geometry: s.centroid,
      })),
      ...parcels.map((p) => ({
        type: 'Feature' as const,
        properties: {
          id: p.id,
          parcelNumber: p.parcelNumber,
          address: p.address,
          inHdZone: p.inHdZone,
          kind: 'parcel',
        },
        geometry: p.geometry,
      })),
    ];
    return { type: 'FeatureCollection' as const, features };
  }

  /**
   * Staff map pin nudge — mutates in-memory seed structures (and matching parcel
   * centroid-ish ring) so GET /api/map reflects the move without Postgres.
   */
  updateStructureCentroid(slug: string, lng: number, lat: number) {
    const s = structures.find((x) => x.publicSlug === slug || x.id === slug);
    if (!s) return null;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;

    const prev = s.centroid.coordinates;
    s.centroid = { type: 'Point', coordinates: [lng, lat] };

    const parcel = parcels.find((p) => p.id === s.parcelId);
    if (parcel) {
      // Keep a small parcel footprint centered on the new pin for notice math.
      const d = 0.00012;
      parcel.geometry = {
        type: 'Polygon',
        coordinates: [
          [
            [lng - d, lat - d],
            [lng + d, lat - d],
            [lng + d, lat + d],
            [lng - d, lat + d],
            [lng - d, lat - d],
          ],
        ],
      };
    }

    return {
      id: s.id,
      publicSlug: s.publicSlug,
      addressLabel: s.addressLabel,
      commonName: s.commonName,
      centroid: s.centroid,
      previous: { type: 'Point' as const, coordinates: prev },
    };
  }

  listApplications(opts?: { status?: string; q?: string }) {
    let rows = applications.filter((a) => PUBLIC_STATUSES.has(a.status));
    if (opts?.status) rows = rows.filter((a) => a.status === opts.status);
    if (opts?.q) {
      const q = opts.q.toLowerCase();
      rows = rows.filter(
        (a) =>
          a.description.toLowerCase().includes(q) ||
          (a.caseNumber ?? '').toLowerCase().includes(q) ||
          (a.applicantName ?? '').toLowerCase().includes(q),
      );
    }
    return rows.map((a) => ({
      ...a,
      structure: structures.find((s) => s.id === a.structureId) ?? null,
      parcel: parcels.find((p) => p.id === a.parcelId) ?? null,
      decisions: decisions.filter((d) => d.applicationId === a.id),
    }));
  }

  getApplication(id: string) {
    const a = applications.find((x) => x.id === id && PUBLIC_STATUSES.has(x.status));
    if (!a) return null;
    return {
      ...a,
      structure: structures.find((s) => s.id === a.structureId) ?? null,
      parcel: parcels.find((p) => p.id === a.parcelId) ?? null,
      decisions: decisions.filter((d) => d.applicationId === a.id),
      documents: [],
    };
  }

  listDecisions(opts?: { q?: string }) {
    let rows = [...decisions];
    if (opts?.q) {
      const q = opts.q.toLowerCase();
      rows = rows.filter((d) => {
        const app = applications.find((a) => a.id === d.applicationId);
        return (
          d.recommendation.toLowerCase().includes(q) ||
          (d.finalOutcome ?? '').toLowerCase().includes(q) ||
          (app?.description ?? '').toLowerCase().includes(q) ||
          (app?.caseNumber ?? '').toLowerCase().includes(q)
        );
      });
    }
    return rows
      .sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? ''))
      .map((d) => ({
        ...d,
        application: applications.find((a) => a.id === d.applicationId) ?? null,
      }));
  }

  listMeetings() {
    return meetings
      .slice()
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
      .map((m) => ({
        ...m,
        // Never expose unpublished / unreviewed AI summaries.
        summary: publishedSummary(m.id),
      }));
  }

  getMeeting(id: string) {
    const m = meetings.find((x) => x.id === id);
    if (!m) return null;
    return { ...m, summary: publishedSummary(m.id) };
  }

  listCriteria() {
    return criteria;
  }

  listGuidance() {
    return guidanceSections;
  }

  listSeats() {
    const now = Date.now();
    return seats.map((seat) => {
      const current =
        seat.terms.find((t) => {
          const start = Date.parse(t.termStart);
          const end = Date.parse(t.termEnd);
          return start <= now && now <= end && !t.vacatedAt;
        }) ?? seat.terms[seat.terms.length - 1];
      const vacant = !current?.memberName || current.memberName.includes('confirm with Clerk');
      return {
        ...seat,
        currentTerm: current,
        isVacant: vacant || !current?.memberName,
      };
    });
  }

  openDataBundle() {
    return {
      license: openDataLicense,
      meta,
      generatedAt: new Date().toISOString(),
      structures: this.listStructures(),
      applications: this.listApplications(),
      decisions: this.listDecisions(),
      meetings: this.listMeetings(),
      seats: this.listSeats(),
      criteria,
      guidance: guidanceSections,
    };
  }

  private structureSummary(s: (typeof structures)[number]) {
    return {
      id: s.id,
      commonName: s.commonName,
      addressLabel: s.addressLabel,
      yearBuilt: s.yearBuilt,
      nrhpContributing: s.nrhpContributing,
      publicSlug: s.publicSlug,
      centroid: s.centroid,
      sourceDocUrl: s.sourceDocUrl,
      parcelId: s.parcelId,
    };
  }
}

function publishedSummary(meetingId: string) {
  const s = meetingSummaries.find(
    (x) => x.meetingId === meetingId && x.isPublished && x.reviewedAt,
  );
  if (!s) return null;
  return {
    id: s.id,
    body: s.body,
    perItem: s.perItem,
    model: s.model,
    generatedAt: s.generatedAt,
    reviewedBy: s.reviewedBy,
    reviewedAt: s.reviewedAt,
    generatedByAi: true,
    humanReviewed: true,
  };
}
