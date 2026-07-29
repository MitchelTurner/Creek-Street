import { Injectable } from '@nestjs/common';
import { applications, meetings, structures } from '../data/phase0-seed';
import {
  buildSeasonDefaults,
  meetingSummaries,
  shipCalls,
  structurePhotos,
  type MeetingSummarySeed,
} from '../data/phase4-seed';
import { Phase2Service } from '../phase2/phase2.service';

@Injectable()
export class Phase4Service {
  private summaries: MeetingSummarySeed[] = meetingSummaries.map((s) => ({ ...s }));

  constructor(private readonly phase2: Phase2Service) {}

  tourismIndex() {
    return {
      title: 'Creek Street — what is this building?',
      lede: 'A walkable historic boardwalk over Ketchikan Creek. Same structure records as the design-review hub — different audience.',
      qrBasePath: '/visit',
      structures: structures
        .filter((s) => s.nrhpContributing)
        .map((s) => ({
          publicSlug: s.publicSlug,
          commonName: s.commonName,
          addressLabel: s.addressLabel,
          yearBuilt: s.yearBuilt,
          teaser: (s.historicNarrative ?? '').slice(0, 160) + '…',
          qrPath: `/visit/${s.publicSlug}`,
          photo: structurePhotos.find((p) => p.structureId === s.id && !p.isHistoric) ??
            structurePhotos.find((p) => p.structureId === s.id) ??
            null,
        })),
    };
  }

  tourismStructure(slug: string) {
    const s = structures.find((x) => x.publicSlug === slug);
    if (!s) return null;
    const photos = structurePhotos
      .filter((p) => p.structureId === s.id && p.moderationStatus === 'APPROVED')
      .sort((a, b) => (a.yearApprox ?? 0) - (b.yearApprox ?? 0));
    return {
      mode: 'tourism',
      structure: {
        publicSlug: s.publicSlug,
        commonName: s.commonName,
        addressLabel: s.addressLabel,
        yearBuilt: s.yearBuilt,
        nrhpContributing: s.nrhpContributing,
        historicNarrative: s.historicNarrative,
        sourceDocUrl: s.sourceDocUrl,
      },
      photos,
      qr: {
        path: `/visit/${s.publicSlug}`,
        note: 'QR-addressable slug for WebAR / wayfinding delivery.',
      },
      civicLink: `/structures/${s.publicSlug}`,
    };
  }

  photosForStructure(structureId: string) {
    return structurePhotos
      .filter((p) => p.structureId === structureId && p.moderationStatus === 'APPROVED')
      .sort((a, b) => (a.yearApprox ?? 9999) - (b.yearApprox ?? 9999));
  }

  constructionWindow(opts: { targetBuildMonth?: number; targetBuildYear?: number; projectType?: string }) {
    const now = new Date();
    const year = opts.targetBuildYear ?? now.getUTCFullYear();
    const month = opts.targetBuildMonth ?? 10; // default October shoulder

    const peak = new Set(buildSeasonDefaults.peakCruiseMonths);
    const inPeak = peak.has(month);

    // Ship density in target month
    const monthCalls = shipCalls.filter((c) => {
      const d = new Date(c.callDate);
      return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
    });
    const pax = monthCalls.reduce((n, c) => n + c.estimatedPax, 0);

    // Timeline median (may be suppressed)
    const timelines = this.phase2.timelineExpectations();
    const bucket = timelines.buckets.find((b) => b.projectType === (opts.projectType ?? 'EXTERIOR_ALTERATION'));
    const medianDays =
      bucket && !bucket.suppressed && 'medianDays' in bucket
        ? (bucket.medianDays as number)
        : timelines.overall.suppressed
          ? 45 // planning assumption only when stats suppressed
          : (timelines.overall.medianDays as number);

    const usingAssumption = Boolean(
      (bucket?.suppressed ?? true) && timelines.overall.suppressed,
    );

    // Backward plan: file by (build window start − median − buffer for board meeting cadence)
    const buildStart = new Date(Date.UTC(year, month - 1, 1));
    const boardBufferDays = 21;
    const fileBy = new Date(buildStart);
    fileBy.setUTCDate(fileBy.getUTCDate() - Math.ceil(medianDays) - boardBufferDays);

    const nextMeetings = meetings
      .filter((m) => m.status === 'SCHEDULED' && Date.parse(m.scheduledAt) >= fileBy.getTime())
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .slice(0, 6);

    return {
      target: { year, month, label: `${year}-${String(month).padStart(2, '0')}` },
      inPeakCruiseSeason: inPeak,
      recommendation: inPeak
        ? 'Target month is inside peak cruise season — exterior work is usually impractical; prefer Oct–Apr shoulder.'
        : 'Target month is outside peak cruise density — a more realistic exterior construction window.',
      shipCallsInMonth: {
        count: monthCalls.length,
        estimatedPaxSum: pax,
        source: 'ktnport-shaped-seed (replace with live ktnport sync; do not re-scrape)',
        sample: monthCalls.slice(0, 5),
      },
      timeline: {
        medianDaysUsed: medianDays,
        usingPlanningAssumption: usingAssumption,
        boardBufferDays,
        disclaimer: timelines.disclaimer,
        projectType: opts.projectType ?? 'EXTERIOR_ALTERATION',
      },
      fileByDate: fileBy.toISOString().slice(0, 10),
      fileByNote:
        'Backward-planned filing date so review can finish before the build window. Not a promise — confirm with the Zoning Administrator and current docket.',
      upcomingMeetingsAfterFileBy: nextMeetings,
      buildSeasonDefaults,
      pendingOnDocket: applications.filter((a) =>
        ['FILED', 'SCHEDULED', 'BOARD_REVIEWED'].includes(a.status),
      ).length,
    };
  }

  shipCalendar(year: number, month?: number) {
    const rows = shipCalls.filter((c) => {
      const d = new Date(c.callDate);
      if (d.getUTCFullYear() !== year) return false;
      if (month && d.getUTCMonth() + 1 !== month) return false;
      return true;
    });
    // Aggregate by day
    const byDay = new Map<string, { date: string; calls: number; estimatedPax: number }>();
    for (const c of rows) {
      const date = c.callDate.slice(0, 10);
      const cur = byDay.get(date) ?? { date, calls: 0, estimatedPax: 0 };
      cur.calls += 1;
      cur.estimatedPax += c.estimatedPax;
      byDay.set(date, cur);
    }
    return {
      year,
      month: month ?? null,
      source: 'ktnport-shaped-seed',
      days: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)),
      note: 'Illustrative until live ktnport internal API sync is wired.',
    };
  }

  /** Public: only human-reviewed published summaries. */
  publishedSummaryForMeeting(meetingId: string) {
    return (
      this.summaries.find((s) => s.meetingId === meetingId && s.isPublished && s.reviewedAt) ?? null
    );
  }

  listPublishedSummaries() {
    return this.summaries
      .filter((s) => s.isPublished && s.reviewedAt)
      .map((s) => ({
        ...s,
        generatedByAi: true,
        humanReviewed: true,
        meeting: meetings.find((m) => m.id === s.meetingId) ?? null,
      }));
  }

  listAllSummariesForStaff() {
    return this.summaries.map((s) => ({
      ...s,
      generatedByAi: true,
      humanReviewed: Boolean(s.reviewedAt),
      meeting: meetings.find((m) => m.id === s.meetingId) ?? null,
    }));
  }

  reviewSummary(id: string, reviewer: string, publish: boolean) {
    const s = this.summaries.find((x) => x.id === id);
    if (!s) return null;
    s.reviewedBy = reviewer;
    s.reviewedAt = new Date().toISOString();
    s.isPublished = publish;
    return s;
  }
}
