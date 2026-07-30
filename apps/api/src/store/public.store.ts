import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryStore } from './memory.store';
import { PUBLIC_APPLICATION_STATUSES, PUBLIC_STATUS_SET } from './public-statuses';

/**
 * Phase 12 dual-read public store.
 * Prisma when connected (USE_MEMORY_STORE=false + DATABASE_URL); otherwise memory seed.
 * DRAFT applications are never returned from either path.
 */
@Injectable()
export class PublicStore {
  private readonly log = new Logger(PublicStore.name);

  constructor(
    private readonly memory: MemoryStore,
    private readonly prisma: PrismaService,
  ) {}

  backend(): 'prisma' | 'memory' {
    return this.prisma.enabled ? 'prisma' : 'memory';
  }

  meta() {
    return this.memory.meta();
  }

  license() {
    return this.memory.license();
  }

  listGuidance() {
    return this.memory.listGuidance();
  }

  listCriteria() {
    return this.memory.listCriteria();
  }

  districtMap() {
    // GeoJSON assembly stays seed-backed until parcel geom sync is complete.
    return this.memory.districtMap();
  }

  async listStructures(opts?: { contributing?: boolean }) {
    if (!this.prisma.enabled) return this.memory.listStructures(opts);
    try {
      const rows = await this.prisma.structure.findMany({
        where:
          opts?.contributing === undefined
            ? undefined
            : { nrhpContributing: opts.contributing },
        orderBy: { addressLabel: 'asc' },
      });
      return rows.map((s) => ({
        id: s.id,
        commonName: s.commonName,
        addressLabel: s.addressLabel,
        yearBuilt: s.yearBuilt,
        nrhpContributing: s.nrhpContributing,
        publicSlug: s.publicSlug,
        centroid: s.centroid,
        sourceDocUrl: s.sourceDocUrl,
        parcelId: s.parcelId,
      }));
    } catch (e) {
      this.log.warn(`Prisma listStructures failed; memory fallback. ${(e as Error).message}`);
      return this.memory.listStructures(opts);
    }
  }

  async getStructureBySlug(slug: string) {
    if (!this.prisma.enabled) return this.memory.getStructureBySlug(slug);
    try {
      const s = await this.prisma.structure.findUnique({
        where: { publicSlug: slug },
        include: {
          parcel: true,
          applications: {
            where: { status: { in: [...PUBLIC_APPLICATION_STATUSES] as never[] } },
            include: { decisions: true },
          },
          photos: {
            where: { moderationStatus: 'APPROVED' },
            orderBy: { yearApprox: 'asc' },
          },
        },
      });
      if (!s) return null;
      return {
        id: s.id,
        parcelId: s.parcelId,
        commonName: s.commonName,
        addressLabel: s.addressLabel,
        yearBuilt: s.yearBuilt,
        nrhpContributing: s.nrhpContributing,
        historicNarrative: s.historicNarrative,
        publicSlug: s.publicSlug,
        centroid: s.centroid,
        sourceDocUrl: s.sourceDocUrl,
        parcel: s.parcel
          ? {
              id: s.parcel.id,
              parcelNumber: s.parcel.parcelNumber,
              address: s.parcel.address,
            }
          : null,
        applications: s.applications.map((a) => this.serializeApp(a)),
        decisions: s.applications.flatMap((a) => a.decisions.map((d) => this.serializeDecision(d))),
        photos: s.photos,
      };
    } catch (e) {
      this.log.warn(`Prisma getStructureBySlug failed; memory fallback. ${(e as Error).message}`);
      return this.memory.getStructureBySlug(slug);
    }
  }

  async listApplications(opts?: { status?: string; q?: string }) {
    if (opts?.status && !PUBLIC_STATUS_SET.has(opts.status)) {
      return [];
    }
    if (!this.prisma.enabled) return this.memory.listApplications(opts);
    try {
      const statusFilter = opts?.status
        ? { status: opts.status as never }
        : { status: { in: [...PUBLIC_APPLICATION_STATUSES] as never[] } };
      const rows = await this.prisma.application.findMany({
        where: {
          ...statusFilter,
          ...(opts?.q
            ? {
                OR: [
                  { description: { contains: opts.q, mode: 'insensitive' } },
                  { caseNumber: { contains: opts.q, mode: 'insensitive' } },
                  { applicantName: { contains: opts.q, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        include: {
          structure: true,
          parcel: true,
          decisions: true,
        },
        orderBy: { filedAt: 'desc' },
      });
      return rows
        .filter((a) => PUBLIC_STATUS_SET.has(a.status))
        .map((a) => ({
          ...this.serializeApp(a),
          structure: a.structure,
          parcel: a.parcel,
          decisions: a.decisions.map((d) => this.serializeDecision(d)),
        }));
    } catch (e) {
      this.log.warn(`Prisma listApplications failed; memory fallback. ${(e as Error).message}`);
      return this.memory.listApplications(opts);
    }
  }

  async getApplication(id: string) {
    if (!this.prisma.enabled) return this.memory.getApplication(id);
    try {
      const a = await this.prisma.application.findFirst({
        where: {
          id,
          status: { in: [...PUBLIC_APPLICATION_STATUSES] as never[] },
        },
        include: {
          structure: true,
          parcel: true,
          decisions: true,
        },
      });
      if (!a || !PUBLIC_STATUS_SET.has(a.status)) return null;
      return {
        ...this.serializeApp(a),
        structure: a.structure,
        parcel: a.parcel,
        decisions: a.decisions.map((d) => this.serializeDecision(d)),
        documents: [],
      };
    } catch (e) {
      this.log.warn(`Prisma getApplication failed; memory fallback. ${(e as Error).message}`);
      return this.memory.getApplication(id);
    }
  }

  async listDecisions(opts?: { q?: string }) {
    if (!this.prisma.enabled) return this.memory.listDecisions(opts);
    try {
      const rows = await this.prisma.decision.findMany({
        include: { application: true },
        orderBy: { decidedAt: 'desc' },
      });
      let out = rows.filter(
        (d) => d.application && PUBLIC_STATUS_SET.has(d.application.status),
      );
      if (opts?.q) {
        const q = opts.q.toLowerCase();
        out = out.filter(
          (d) =>
            d.recommendation.toLowerCase().includes(q) ||
            (d.finalOutcome ?? '').toLowerCase().includes(q) ||
            (d.application?.description ?? '').toLowerCase().includes(q) ||
            (d.application?.caseNumber ?? '').toLowerCase().includes(q),
        );
      }
      return out.map((d) => ({
        ...this.serializeDecision(d),
        application: d.application ? this.serializeApp(d.application) : null,
      }));
    } catch (e) {
      this.log.warn(`Prisma listDecisions failed; memory fallback. ${(e as Error).message}`);
      return this.memory.listDecisions(opts);
    }
  }

  async listMeetings() {
    if (!this.prisma.enabled) return this.memory.listMeetings();
    try {
      const rows = await this.prisma.meeting.findMany({
        include: {
          agendaItems: true,
          summary: true,
        },
        orderBy: { scheduledAt: 'desc' },
      });
      return rows.map((m) => ({
        id: m.id,
        scheduledAt: m.scheduledAt.toISOString(),
        location: m.location,
        status: m.status,
        quorumMet: m.quorumMet,
        cancelReason: m.cancelReason,
        noticeUrl: m.noticeUrl,
        agendaUrl: m.agendaUrl,
        minutesUrl: m.minutesUrl,
        videoUrl: m.videoUrl,
        sourceDocUrl: m.sourceDocUrl,
        agendaItems: m.agendaItems,
        summary: this.publicSummary(m.summary),
      }));
    } catch (e) {
      this.log.warn(`Prisma listMeetings failed; memory fallback. ${(e as Error).message}`);
      return this.memory.listMeetings();
    }
  }

  async getMeeting(id: string) {
    if (!this.prisma.enabled) return this.memory.getMeeting(id);
    try {
      const m = await this.prisma.meeting.findUnique({
        where: { id },
        include: { agendaItems: true, summary: true },
      });
      if (!m) return null;
      return {
        id: m.id,
        scheduledAt: m.scheduledAt.toISOString(),
        location: m.location,
        status: m.status,
        quorumMet: m.quorumMet,
        cancelReason: m.cancelReason,
        noticeUrl: m.noticeUrl,
        agendaUrl: m.agendaUrl,
        minutesUrl: m.minutesUrl,
        videoUrl: m.videoUrl,
        sourceDocUrl: m.sourceDocUrl,
        agendaItems: m.agendaItems,
        summary: this.publicSummary(m.summary),
      };
    } catch (e) {
      this.log.warn(`Prisma getMeeting failed; memory fallback. ${(e as Error).message}`);
      return this.memory.getMeeting(id);
    }
  }

  async listSeats() {
    if (!this.prisma.enabled) return this.memory.listSeats();
    try {
      const rows = await this.prisma.seat.findMany({ include: { terms: true } });
      const now = Date.now();
      return rows.map((seat) => {
        const current =
          seat.terms.find((t) => {
            const start = t.termStart.getTime();
            const end = t.termEnd.getTime();
            return start <= now && now <= end && !t.vacatedAt;
          }) ?? seat.terms[seat.terms.length - 1];
        const vacant =
          !current?.memberName || current.memberName.includes('confirm with Clerk');
        return {
          id: seat.id,
          label: seat.label,
          seatType: seat.seatType,
          terms: seat.terms.map((t) => ({
            id: t.id,
            memberName: t.memberName,
            termStart: t.termStart.toISOString(),
            termEnd: t.termEnd.toISOString(),
            vacatedAt: t.vacatedAt?.toISOString() ?? null,
          })),
          currentTerm: current
            ? {
                id: current.id,
                memberName: current.memberName,
                termStart: current.termStart.toISOString(),
                termEnd: current.termEnd.toISOString(),
                vacatedAt: current.vacatedAt?.toISOString() ?? null,
              }
            : null,
          isVacant: vacant || !current?.memberName,
        };
      });
    } catch (e) {
      this.log.warn(`Prisma listSeats failed; memory fallback. ${(e as Error).message}`);
      return this.memory.listSeats();
    }
  }

  async openDataBundle() {
    if (!this.prisma.enabled) return this.memory.openDataBundle();
    const [structures, applications, decisions, meetings, seats] = await Promise.all([
      this.listStructures(),
      this.listApplications(),
      this.listDecisions(),
      this.listMeetings(),
      this.listSeats(),
    ]);
    return {
      license: this.license(),
      meta: this.meta(),
      generatedAt: new Date().toISOString(),
      backend: this.backend(),
      structures,
      applications,
      decisions,
      meetings,
      seats,
      criteria: this.listCriteria(),
      guidance: this.listGuidance(),
    };
  }

  private publicSummary(
    s: {
      id: string;
      body: string;
      perItem: unknown;
      model: string;
      generatedAt: Date;
      reviewedBy: string | null;
      reviewedAt: Date | null;
      isPublished: boolean;
    } | null,
  ) {
    if (!s || !s.isPublished || !s.reviewedAt) return null;
    return {
      id: s.id,
      body: s.body,
      perItem: s.perItem,
      model: s.model,
      generatedAt: s.generatedAt.toISOString(),
      reviewedBy: s.reviewedBy,
      reviewedAt: s.reviewedAt.toISOString(),
      generatedByAi: true,
      humanReviewed: true,
    };
  }

  private serializeApp(a: {
    id: string;
    caseNumber: string | null;
    parcelId: string;
    structureId: string | null;
    applicantName: string | null;
    projectType: string;
    description: string;
    status: string;
    filedAt: Date | null;
    source: string;
    sourceDocUrl: string | null;
  }) {
    return {
      id: a.id,
      caseNumber: a.caseNumber,
      parcelId: a.parcelId,
      structureId: a.structureId,
      applicantName: a.applicantName,
      projectType: a.projectType,
      description: a.description,
      status: a.status,
      filedAt: a.filedAt?.toISOString() ?? null,
      source: a.source,
      sourceDocUrl: a.sourceDocUrl,
    };
  }

  private serializeDecision(d: {
    id: string;
    applicationId: string;
    meetingId: string | null;
    recommendation: string;
    conditions: string | null;
    voteFor: number | null;
    voteAgainst: number | null;
    finalOutcome: string | null;
    sourceDocUrl: string;
    decidedAt: Date | null;
  }) {
    return {
      id: d.id,
      applicationId: d.applicationId,
      meetingId: d.meetingId,
      recommendation: d.recommendation,
      conditions: d.conditions,
      voteFor: d.voteFor,
      voteAgainst: d.voteAgainst,
      finalOutcome: d.finalOutcome,
      sourceDocUrl: d.sourceDocUrl,
      decidedAt: d.decidedAt?.toISOString() ?? null,
    };
  }
}
