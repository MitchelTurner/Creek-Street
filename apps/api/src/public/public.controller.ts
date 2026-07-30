import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Headers,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PublicStore } from '../store/public.store';
import { CaseBriefService } from './case-brief.service';
import { CriterionAtlasService } from './criterion-atlas.service';
import { DecisionSheetService } from './decision-sheet.service';
import { FilingPlanService, type FilingPlanInput } from './filing-plan.service';
import { MeetingAgendaService } from './meeting-agenda.service';
import { MeetingSummarySheetService } from './meeting-summary-sheet.service';
import { ReadinessService } from './readiness.service';
import { SearchService } from './search.service';
import { StructureSheetService } from './structure-sheet.service';
import { publicSitemapPaths, renderSitemapXml } from './sitemap';

@Controller()
export class PublicController {
  constructor(
    private readonly store: PublicStore,
    private readonly readiness: ReadinessService,
    private readonly searchService: SearchService,
    private readonly caseBriefs: CaseBriefService,
    private readonly meetingAgendas: MeetingAgendaService,
    private readonly meetingSummaries: MeetingSummarySheetService,
    private readonly decisionSheets: DecisionSheetService,
    private readonly criterionAtlas: CriterionAtlasService,
    private readonly structureSheets: StructureSheetService,
    private readonly filingPlans: FilingPlanService,
  ) {}

  @Get('health')
  health() {
    return {
      ok: true,
      phase: 31,
      store: this.store.backend(),
      opsDashboard: true,
      staffQueue: true,
      opsBrief: true,
      queueAging: true,
      alertScheduler: true,
      queueClaims: true,
      meetingPrep: true,
      meetingOutcomes: true,
      publicOutcomesDigest: true,
      caseBrief: true,
      caseBriefDigest: true,
      meetingAgenda: true,
      meetingSummarySheet: true,
      decisionSheet: true,
      criterionAtlas: true,
      structureSheet: true,
      filingPathway: true,
    };
  }

  @Get('search')
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  search(@Query('q') q?: string, @Query('limit') limit?: string) {
    return {
      ...this.searchService.search(q ?? '', limit ? Number(limit) : 20),
      note: 'Public mirror only — DRAFT applications and unpublished summaries are never indexed.',
    };
  }

  @Get('ready')
  @Header('Cache-Control', 'no-store')
  ready() {
    return this.readiness.check();
  }

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  sitemap(
    @Headers('host') host?: string,
    @Headers('x-forwarded-host') xfHost?: string,
    @Headers('x-forwarded-proto') xfProto?: string,
  ) {
    const h = xfHost || host || 'creek-street.local';
    const proto = xfProto || 'https';
    const origin = process.env.PUBLIC_WEB_ORIGIN || `${proto}://${h}`;
    return renderSitemapXml(origin);
  }

  @Get('sitemap/paths')
  @Header('Cache-Control', 'public, max-age=300')
  sitemapPaths() {
    return { paths: publicSitemapPaths(), note: 'Public surfaces only — no workspace/official/admin/auth.' };
  }

  @Get('meta')
  meta() {
    return this.store.meta();
  }

  @Get('map')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  map() {
    return this.store.districtMap();
  }

  @Get('structures')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  structures(@Query('contributing') contributing?: string) {
    let flag: boolean | undefined;
    if (contributing === 'true') flag = true;
    if (contributing === 'false') flag = false;
    return this.store.listStructures({ contributing: flag });
  }

  @Get('structures/:slug')
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=300')
  async structure(@Param('slug') slug: string) {
    const row = await this.store.getStructureBySlug(slug);
    if (!row) throw new NotFoundException('Structure not found');
    return row;
  }

  @Get('structures/:slug/sheet')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  structureSheet(@Param('slug') slug: string) {
    const row = this.structureSheets.sheet(slug);
    if (!row) throw new NotFoundException('Structure not found');
    return row;
  }

  @Get('structures/:slug/sheet.pdf')
  @Header('Cache-Control', 'public, max-age=60')
  async structureSheetPdf(@Param('slug') slug: string, @Res() res: Response) {
    const buf = await this.structureSheets.buildPdf(slug);
    if (!buf) throw new NotFoundException('Structure not found');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="creek-street-structure-${slug}.pdf"`,
    );
    res.send(buf);
  }

  @Get('applications')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  applications(@Query('status') status?: string, @Query('q') q?: string) {
    return this.store.listApplications({ status, q });
  }

  @Get('applications/:id')
  async application(@Param('id') id: string) {
    const row = await this.store.getApplication(id);
    if (!row) throw new NotFoundException('Application not found');
    return row;
  }

  @Get('applications/:id/brief')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  applicationBrief(@Param('id') id: string) {
    const row = this.caseBriefs.brief(id);
    if (!row) throw new NotFoundException('Application not found');
    return row;
  }

  @Get('applications/:id/brief.pdf')
  @Header('Cache-Control', 'public, max-age=60')
  async applicationBriefPdf(@Param('id') id: string, @Res() res: Response) {
    const buf = await this.caseBriefs.buildPdf(id);
    if (!buf) throw new NotFoundException('Application not found');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="creek-street-case-brief-${id}.pdf"`,
    );
    res.send(buf);
  }

  @Get('decisions')
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=300')
  decisions(@Query('q') q?: string) {
    return this.store.listDecisions({ q });
  }

  @Get('decisions/:id')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  decisionSheet(@Param('id') id: string) {
    const row = this.decisionSheets.sheet(id);
    if (!row) throw new NotFoundException('Decision not found');
    return row;
  }

  @Get('decisions/:id/sheet.pdf')
  @Header('Cache-Control', 'public, max-age=60')
  async decisionSheetPdf(@Param('id') id: string, @Res() res: Response) {
    const buf = await this.decisionSheets.buildPdf(id);
    if (!buf) throw new NotFoundException('Decision not found');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="creek-street-decision-${id}.pdf"`,
    );
    res.send(buf);
  }

  @Get('meetings')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  meetings() {
    return this.store.listMeetings();
  }

  @Get('meetings/:id')
  async meeting(@Param('id') id: string) {
    const row = await this.store.getMeeting(id);
    if (!row) throw new NotFoundException('Meeting not found');
    return row;
  }

  @Get('meetings/:id/agenda')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  meetingAgenda(@Param('id') id: string) {
    const row = this.meetingAgendas.agenda(id);
    if (!row) throw new NotFoundException('Meeting not found');
    return row;
  }

  @Get('meetings/:id/agenda.pdf')
  @Header('Cache-Control', 'public, max-age=60')
  async meetingAgendaPdf(@Param('id') id: string, @Res() res: Response) {
    const buf = await this.meetingAgendas.buildPdf(id);
    if (!buf) throw new NotFoundException('Meeting not found');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="creek-street-meeting-agenda-${id}.pdf"`,
    );
    res.send(buf);
  }

  @Get('meetings/:id/summary-sheet')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  meetingSummarySheet(@Param('id') id: string) {
    const row = this.meetingSummaries.sheet(id);
    if (!row) throw new NotFoundException('Published summary not found');
    return row;
  }

  @Get('meetings/:id/summary-sheet.pdf')
  @Header('Cache-Control', 'public, max-age=60')
  async meetingSummarySheetPdf(@Param('id') id: string, @Res() res: Response) {
    const buf = await this.meetingSummaries.buildPdf(id);
    if (!buf) throw new NotFoundException('Published summary not found');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="creek-street-meeting-summary-${id}.pdf"`,
    );
    res.send(buf);
  }

  @Get('guidance')
  @Header('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200')
  guidance() {
    return {
      sections: this.store.listGuidance(),
      criteria: this.store.listCriteria(),
      disclaimer:
        'Plain-language guidance summarizes what the code says. It is not a legal conclusion. The Zoning Administrator decides applicability.',
    };
  }

  @Get('guidance/criteria')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  guidanceCriteria() {
    return this.criterionAtlas.list();
  }

  @Get('guidance/criteria/:key')
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=300')
  guidanceCriterion(@Param('key') key: string) {
    const row = this.criterionAtlas.atlas(key);
    if (!row) throw new NotFoundException('Criterion not found');
    return row;
  }

  @Get('guidance/criteria/:key/sheet.pdf')
  @Header('Cache-Control', 'public, max-age=120')
  async guidanceCriterionPdf(@Param('key') key: string, @Res() res: Response) {
    const buf = await this.criterionAtlas.buildPdf(key);
    if (!buf) throw new NotFoundException('Criterion not found');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="creek-street-criterion-${key}.pdf"`,
    );
    res.send(buf);
  }

  @Get('board/seats')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  async seats() {
    return {
      seats: await this.store.listSeats(),
      apply: this.store.meta().applyForBoard,
      note: 'Roster terms marked “confirm with Clerk” are placeholders until borough appointment records are mirrored.',
    };
  }

  @Get('filing/plan')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  async filingPlanGet(
    @Query('projectType') projectType?: string,
    @Query('answers') answers?: string,
    @Query('address') address?: string,
    @Query('parcelId') parcelId?: string,
    @Query('structureSlug') structureSlug?: string,
    @Query('buildMonth') buildMonth?: string,
    @Query('buildYear') buildYear?: string,
    @Query('includeUnverifiedPermits') includeUnverifiedPermits?: string,
    @Query('inHdZone') inHdZone?: string,
    @Query('exteriorChange') exteriorChange?: string,
    @Query('overWater') overWater?: string,
    @Query('inWater') inWater?: string,
    @Query('substructure') substructure?: string,
    @Query('groundDisturbing') groundDisturbing?: string,
    @Query('structural') structural?: string,
    @Query('occupancyChange') occupancyChange?: string,
    @Query('fill') fill?: string,
    @Query('wastewater') wastewater?: string,
    @Query('federalNexus') federalNexus?: string,
  ) {
    const plan = await this.filingPlans.plan(
      this.parseFilingQuery({
        projectType,
        answers,
        address,
        parcelId,
        structureSlug,
        buildMonth,
        buildYear,
        includeUnverifiedPermits,
        inHdZone,
        exteriorChange,
        overWater,
        inWater,
        substructure,
        groundDisturbing,
        structural,
        occupancyChange,
        fill,
        wastewater,
        federalNexus,
      }),
    );
    if (!plan) throw new NotFoundException('No published triage flow for this project type');
    return plan;
  }

  @Post('filing/plan')
  async filingPlanPost(@Body() body: FilingPlanInput) {
    const plan = await this.filingPlans.plan({
      ...body,
      projectType: body.projectType?.toUpperCase(),
      answers: body.answers ?? {},
    });
    if (!plan) throw new NotFoundException('No published triage flow for this project type');
    return plan;
  }

  @Get('filing/plan.pdf')
  @Header('Cache-Control', 'public, max-age=60')
  async filingPlanPdf(
    @Res() res: Response,
    @Query('projectType') projectType?: string,
    @Query('answers') answers?: string,
    @Query('address') address?: string,
    @Query('parcelId') parcelId?: string,
    @Query('structureSlug') structureSlug?: string,
    @Query('buildMonth') buildMonth?: string,
    @Query('buildYear') buildYear?: string,
    @Query('includeUnverifiedPermits') includeUnverifiedPermits?: string,
    @Query('inHdZone') inHdZone?: string,
    @Query('exteriorChange') exteriorChange?: string,
    @Query('overWater') overWater?: string,
    @Query('inWater') inWater?: string,
    @Query('substructure') substructure?: string,
    @Query('groundDisturbing') groundDisturbing?: string,
    @Query('structural') structural?: string,
    @Query('occupancyChange') occupancyChange?: string,
    @Query('fill') fill?: string,
    @Query('wastewater') wastewater?: string,
    @Query('federalNexus') federalNexus?: string,
  ) {
    const buf = await this.filingPlans.buildPdf(
      this.parseFilingQuery({
        projectType,
        answers,
        address,
        parcelId,
        structureSlug,
        buildMonth,
        buildYear,
        includeUnverifiedPermits,
        inHdZone,
        exteriorChange,
        overWater,
        inWater,
        substructure,
        groundDisturbing,
        structural,
        occupancyChange,
        fill,
        wastewater,
        federalNexus,
      }),
    );
    if (!buf) throw new NotFoundException('No published triage flow for this project type');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="creek-street-filing-plan-${(projectType ?? 'plan').toLowerCase()}.pdf"`,
    );
    res.send(buf);
  }

  private parseFilingQuery(q: Record<string, string | undefined>): FilingPlanInput {
    let answers: Record<string, string> = {};
    if (q.answers?.trim()) {
      try {
        const parsed = JSON.parse(q.answers) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('answers must be a JSON object');
        }
        answers = Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
        );
      } catch {
        throw new BadRequestException('answers must be a URL-encoded JSON object');
      }
    }

    const flag = (key: string) => (q[key] === 'true' ? true : q[key] === 'false' ? false : undefined);
    const permitFlags = {
      inHdZone: flag('inHdZone'),
      exteriorChange: flag('exteriorChange'),
      overWater: flag('overWater'),
      inWater: flag('inWater'),
      substructure: flag('substructure'),
      groundDisturbing: flag('groundDisturbing'),
      structural: flag('structural'),
      occupancyChange: flag('occupancyChange'),
      fill: flag('fill'),
      wastewater: flag('wastewater'),
      federalNexus: flag('federalNexus'),
    };

    return {
      projectType: q.projectType ?? '',
      answers,
      address: q.address,
      parcelId: q.parcelId,
      structureSlug: q.structureSlug,
      buildMonth: q.buildMonth ? Number(q.buildMonth) : undefined,
      buildYear: q.buildYear ? Number(q.buildYear) : undefined,
      includeUnverifiedPermits: q.includeUnverifiedPermits === 'true',
      permitFlags,
    };
  }
}
