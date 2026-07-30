import { BadRequestException, Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { meta, structures } from '../data/phase0-seed';
import { Phase1Service, type PermitQuery } from '../phase1/phase1.service';
import { Phase2Service } from '../phase2/phase2.service';
import { Phase4Service } from '../phase4/phase4.service';

export type FilingPlanInput = {
  projectType: string;
  answers?: Record<string, string>;
  address?: string;
  parcelId?: string;
  structureSlug?: string;
  buildMonth?: number;
  buildYear?: number;
  includeUnverifiedPermits?: boolean;
  /** Optional explicit permit flags; otherwise inferred from triage answers when possible. */
  permitFlags?: Partial<Omit<PermitQuery, 'includeUnverified'>>;
};

/**
 * Phase 31 — applicant filing pathway (zero auth).
 * Stitches triage → permits → HD notice → build-window file-by into one printable plan.
 * Lives in PublicModule so Phase1 never imports Phase2/Phase4.
 * Never surfaces DRAFT applications, MemberNotes, or unreviewed AI summary body.
 */
@Injectable()
export class FilingPlanService {
  constructor(
    private readonly phase1: Phase1Service,
    private readonly phase2: Phase2Service,
    private readonly phase4: Phase4Service,
  ) {}

  async plan(input: FilingPlanInput) {
    const projectType = (input.projectType ?? '').trim().toUpperCase();
    if (!projectType) {
      throw new BadRequestException('projectType is required');
    }

    const answers = input.answers ?? {};
    const triage = this.phase1.evaluateTriage(projectType, answers);
    if (!triage) {
      return null;
    }

    const permitFlags = this.resolvePermitFlags(projectType, answers, triage, input.permitFlags);
    const permits = this.phase1.matchPermitTriggers({
      ...permitFlags,
      includeUnverified: Boolean(input.includeUnverifiedPermits),
    });

    const address =
      input.address?.trim() ||
      (input.structureSlug
        ? structures.find((s) => s.publicSlug === input.structureSlug)?.addressLabel
        : undefined);
    const notice = await this.phase2.noticeLookup({
      address,
      parcelId: input.parcelId,
    });

    const buildMonth = input.buildMonth ?? 10;
    const buildYear = input.buildYear ?? new Date().getUTCFullYear();
    const window = this.phase4.constructionWindow({
      targetBuildMonth: buildMonth,
      targetBuildYear: buildYear,
      projectType,
    });

    const structure = input.structureSlug
      ? structures.find((s) => s.publicSlug === input.structureSlug) ?? null
      : null;

    const criteriaKeys =
      triage.status === 'complete' && Array.isArray(triage.criteria) ? triage.criteria : [];

    const steps = this.buildSteps({
      projectType,
      triage,
      criteriaKeys,
      structure,
      permits,
      notice,
      window,
      address,
    });

    const query = this.serializeQuery({
      projectType,
      answers,
      address: input.address,
      parcelId: input.parcelId,
      structureSlug: input.structureSlug,
      buildMonth,
      buildYear,
      includeUnverifiedPermits: input.includeUnverifiedPermits,
      permitFlags,
    });

    return {
      phase: 31,
      projectType,
      answers,
      triage,
      criteria: criteriaKeys.map((key) => ({
        key,
        ui: `/guidance/criteria/${key}`,
        api: `/api/guidance/criteria/${key}`,
      })),
      structure: structure
        ? {
            publicSlug: structure.publicSlug,
            commonName: structure.commonName,
            addressLabel: structure.addressLabel,
            ui: `/structures/${structure.publicSlug}`,
            sheetApi: `/api/structures/${structure.publicSlug}/sheet`,
          }
        : null,
      permits: {
        includeUnverified: permits.includeUnverified,
        note: permits.note,
        query: permits.query,
        results: permits.results.map((r) => ({
          id: r.id,
          permitName: r.permitName,
          statutoryCite: r.statutoryCite,
          typicalLeadTimeDays: r.typicalLeadTimeDays,
          guidanceUrl: r.guidanceUrl,
          verified: r.verified,
          agency: {
            name: r.agency.name,
            shortName: r.agency.shortName,
            contactUrl: r.agency.contactUrl,
          },
        })),
      },
      notice: this.summarizeNotice(notice),
      constructionWindow: {
        target: window.target,
        inPeakCruiseSeason: window.inPeakCruiseSeason,
        recommendation: window.recommendation,
        fileByDate: window.fileByDate,
        fileByNote: window.fileByNote,
        timeline: window.timeline,
        upcomingMeetingsAfterFileBy: window.upcomingMeetingsAfterFileBy.map((m) => ({
          id: m.id,
          scheduledAt: m.scheduledAt,
          status: m.status,
          agendaUi: `/meetings/${m.id}`,
        })),
      },
      steps,
      zoningAdministrator: meta.zoningAdministratorContact,
      handoff: {
        workspaceUi: '/workspace',
        workspaceNote:
          'Sign in to save a private preparation draft. Workspace drafts are never board records and never appear on the public mirror.',
        triageUi: `/triage`,
        permitsUi: '/permits',
        noticeUi: address ? `/notice?address=${encodeURIComponent(address)}` : '/notice',
        constructionUi: `/construction?month=${buildMonth}&year=${buildYear}&projectType=${projectType}`,
      },
      disclaimer:
        'Filing pathway stitches published triage, verified permit triggers, HD notice lookup, and build-window planning. It is not a legal conclusion and not an official borough filing. Confirm every step with the Zoning Administrator. DRAFT applications, MemberNotes, and unreviewed AI summaries are never included. Operated by Mitchel Turner Dev, LLC — not a borough property.',
      links: {
        json: `/api/filing/plan?${query}`,
        pdf: `/api/filing/plan.pdf?${query}`,
        ui: `/filing?${query}`,
      },
    };
  }

  async buildPdf(input: FilingPlanInput): Promise<Buffer | null> {
    const data = await this.plan(input);
    if (!data) return null;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 54, size: 'LETTER' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).fillColor('#000000').text('Creek Street Design Review — Filing pathway');
      doc.moveDown(0.25);
      doc.fontSize(9).fillColor('#444444').text(data.disclaimer, { width: 480 });
      doc.fillColor('#000000');
      doc.moveDown();

      doc.fontSize(12).text(`Project type: ${data.projectType.replace(/_/g, ' ')}`);
      if (data.structure) {
        doc
          .fontSize(10)
          .text(
            `Structure: ${data.structure.commonName ?? data.structure.addressLabel} — ${data.structure.ui}`,
          );
      }
      doc.moveDown();

      doc.fontSize(12).text('Pathway steps');
      doc.moveDown(0.2);
      for (const step of data.steps) {
        doc.fontSize(11).fillColor('#000000').text(`${step.order}. ${step.title}`);
        doc.fontSize(10).text(step.summary, { width: 480 });
        if (step.href) {
          doc.fontSize(9).fillColor('#333333').text(`  → ${step.href}`);
        }
        doc.fillColor('#000000');
        doc.moveDown(0.35);
      }

      doc.moveDown(0.2);
      doc.fontSize(12).text('File-by date');
      doc
        .fontSize(14)
        .text(
          `${data.constructionWindow.fileByDate} (build ${data.constructionWindow.target.label})`,
        );
      doc.fontSize(9).fillColor('#444444').text(data.constructionWindow.fileByNote, { width: 480 });
      doc.fillColor('#000000');
      doc.moveDown();

      if (data.permits.results.length) {
        doc.fontSize(12).text('Matched permit triggers');
        for (const p of data.permits.results.slice(0, 12)) {
          doc
            .fontSize(10)
            .text(
              `• ${p.agency.shortName}: ${p.permitName}${p.verified ? '' : ' (unverified)'} — ${p.statutoryCite}`,
            );
        }
        doc.moveDown();
      }

      doc.fontSize(12).text(data.zoningAdministrator.label);
      doc.fontSize(10).text(data.zoningAdministrator.url);
      doc.moveDown();
      doc.fontSize(9).fillColor('#444444').text(`Interactive plan: ${data.links.ui}`);
      doc.text('Private draft handoff: /workspace');

      doc.end();
    });
  }

  private buildSteps(opts: {
    projectType: string;
    triage: NonNullable<ReturnType<Phase1Service['evaluateTriage']>>;
    criteriaKeys: string[];
    structure: (typeof structures)[number] | null;
    permits: ReturnType<Phase1Service['matchPermitTriggers']>;
    notice: Awaited<ReturnType<Phase2Service['noticeLookup']>>;
    window: ReturnType<Phase4Service['constructionWindow']>;
    address?: string;
  }) {
    const steps: Array<{
      order: number;
      key: string;
      title: string;
      summary: string;
      href: string | null;
    }> = [];
    let order = 1;

    if (opts.triage.status === 'complete') {
      steps.push({
        order: order++,
        key: 'triage',
        title: `Triage outcome: ${String(opts.triage.outcome).replace(/_/g, ' ')}`,
        summary: opts.triage.summary,
        href: '/triage',
      });
    } else if (opts.triage.status === 'in_progress') {
      steps.push({
        order: order++,
        key: 'triage',
        title: 'Finish triage questions',
        summary: opts.triage.current.prompt,
        href: '/triage',
      });
    } else {
      steps.push({
        order: order++,
        key: 'triage',
        title: 'Triage needs attention',
        summary: opts.triage.message,
        href: '/triage',
      });
    }

    if (opts.criteriaKeys.length) {
      steps.push({
        order: order++,
        key: 'criteria',
        title: 'Review applicable criteria',
        summary: `Open teaching pages for ${opts.criteriaKeys.map((k) => k.replace(/_/g, ' ')).join(', ')}.`,
        href: `/guidance/criteria/${opts.criteriaKeys[0]}`,
      });
    }

    if (opts.structure) {
      steps.push({
        order: order++,
        key: 'structure',
        title: 'Study the structure dossier',
        summary: `${opts.structure.commonName ?? opts.structure.addressLabel} — prior public cases, decisions, and precedents.`,
        href: `/structures/${opts.structure.publicSlug}`,
      });
    }

    steps.push({
      order: order++,
      key: 'permits',
      title:
        opts.permits.results.length > 0
          ? `Check ${opts.permits.results.length} matched permit trigger${opts.permits.results.length === 1 ? '' : 's'}`
          : 'Check multi-agency permit triggers',
      summary: opts.permits.note,
      href: '/permits',
    });

    if (opts.notice.found) {
      const count = opts.notice.noticedParcelSet?.length ?? 0;
      steps.push({
        order: order++,
        key: 'notice',
        title: 'Map the HD notice set',
        summary: `Subject parcel resolved · ~${count} parcels in the 600 ft city notice radius (KGBC 18.90.060 style) plus HD district-wide notice under 18.90.020.`,
        href: opts.address ? `/notice?address=${encodeURIComponent(opts.address)}` : '/notice',
      });
    } else {
      steps.push({
        order: order++,
        key: 'notice',
        title: 'Add an address for notice lookup',
        summary:
          opts.notice.message ??
          'Parcel not found. Try an HD zone address (e.g. "24 Creek Street") or parcel id.',
        href: '/notice',
      });
    }

    steps.push({
      order: order++,
      key: 'file_by',
      title: `File by ${opts.window.fileByDate}`,
      summary: `${opts.window.recommendation} Target build ${opts.window.target.label}.`,
      href: `/construction?month=${opts.window.target.month}&year=${opts.window.target.year}&projectType=${opts.projectType}`,
    });

    steps.push({
      order: order++,
      key: 'workspace',
      title: 'Optional: save a private preparation draft',
      summary:
        'Workspace drafts stay private until you file with the borough. They never appear on the public docket.',
      href: '/workspace',
    });

    steps.push({
      order: order++,
      key: 'zoning_administrator',
      title: meta.zoningAdministratorContact.label,
      summary:
        'Always confirm applicability, exhibits, and filing mechanics with the Zoning Administrator before relying on this pathway.',
      href: meta.zoningAdministratorContact.url,
    });

    return steps;
  }

  private resolvePermitFlags(
    projectType: string,
    answers: Record<string, string>,
    triage: NonNullable<ReturnType<Phase1Service['evaluateTriage']>>,
    explicit?: FilingPlanInput['permitFlags'],
  ): Omit<PermitQuery, 'includeUnverified'> {
    const inferred: Omit<PermitQuery, 'includeUnverified'> = {
      inHdZone: false,
      exteriorChange: false,
      overWater: false,
      inWater: false,
      substructure: false,
      groundDisturbing: false,
      structural: false,
      occupancyChange: false,
      fill: false,
      wastewater: false,
      federalNexus: false,
    };

    const answerVals = Object.values(answers);
    if (answerVals.includes('yes') || projectType !== 'OTHER') {
      // HD-focused flows usually start with an in-district question answered yes.
      if (
        answers.sign_start === 'yes' ||
        answers.ext_start === 'yes' ||
        answers.new_start === 'yes' ||
        Object.entries(answers).some(
          ([k, v]) => (k.includes('start') || k.includes('zone') || k.includes('hd')) && v === 'yes',
        )
      ) {
        inferred.inHdZone = true;
      }
    }

    if (triage.status === 'complete' && triage.outcome === 'REVIEW_REQUIRED') {
      inferred.inHdZone = true;
      inferred.exteriorChange = true;
    }

    if (
      projectType === 'SUBSTRUCTURE_PILING' ||
      projectType === 'BOARDWALK_STRUCTURE' ||
      answers.sub_start === 'yes'
    ) {
      inferred.substructure = true;
      inferred.overWater = true;
      inferred.inHdZone = true;
    }

    if (projectType === 'SIGNAGE' || projectType === 'AWNING_CANOPY' || projectType === 'EXTERIOR_ALTERATION') {
      if (inferred.inHdZone || triage.status === 'complete') {
        inferred.exteriorChange = inferred.exteriorChange || triage.status === 'complete';
      }
    }

    return {
      ...inferred,
      ...Object.fromEntries(
        Object.entries(explicit ?? {}).filter(([, v]) => v !== undefined),
      ),
    };
  }

  private summarizeNotice(notice: Awaited<ReturnType<Phase2Service['noticeLookup']>>) {
    if (!notice.found || !notice.subjectParcel || !notice.noticedParcelSet) {
      return {
        found: false as const,
        message:
          ('message' in notice && notice.message) ||
          'Parcel not found. Try an HD zone address (e.g. "24 Creek Street") or parcel id.',
        config: notice.config,
      };
    }
    const subject = notice.subjectParcel;
    const noticed = notice.noticedParcelSet;
    return {
      found: true as const,
      method: notice.method,
      note: notice.note,
      subjectParcel: {
        id: subject.id,
        parcelNumber: subject.parcelNumber,
        address: subject.address,
      },
      radiusFeet: notice.radiusFeet,
      noticedParcelCount: noticed.length,
      pendingApplicationsThatWouldNoticeAddress: (
        notice.pendingApplicationsThatWouldNoticeAddress ?? []
      )
        .filter(
          (row): row is NonNullable<typeof row> =>
            Boolean(
              row &&
                row.within600ft &&
                row.application.status !== 'DRAFT' &&
                !String(row.application.id).includes('draft'),
            ),
        )
        .map((row) => ({
          applicationId: row.application.id,
          caseNumber: row.application.caseNumber,
          status: row.application.status,
          caseBriefUi: `/docket/${row.application.id}`,
          meters: row.meters,
        })),
      config: notice.config,
    };
  }

  private serializeQuery(input: {
    projectType: string;
    answers: Record<string, string>;
    address?: string;
    parcelId?: string;
    structureSlug?: string;
    buildMonth: number;
    buildYear: number;
    includeUnverifiedPermits?: boolean;
    permitFlags: Omit<PermitQuery, 'includeUnverified'>;
  }) {
    const qs = new URLSearchParams();
    qs.set('projectType', input.projectType);
    if (Object.keys(input.answers).length) {
      qs.set('answers', JSON.stringify(input.answers));
    }
    if (input.address?.trim()) qs.set('address', input.address.trim());
    if (input.parcelId?.trim()) qs.set('parcelId', input.parcelId.trim());
    if (input.structureSlug?.trim()) qs.set('structureSlug', input.structureSlug.trim());
    qs.set('buildMonth', String(input.buildMonth));
    qs.set('buildYear', String(input.buildYear));
    if (input.includeUnverifiedPermits) qs.set('includeUnverifiedPermits', 'true');
    for (const [k, v] of Object.entries(input.permitFlags)) {
      if (v) qs.set(k, 'true');
    }
    return qs.toString();
  }
}
