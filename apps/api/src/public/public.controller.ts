import {
  Controller,
  Get,
  Header,
  Headers,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PublicStore } from '../store/public.store';
import { CaseBriefService } from './case-brief.service';
import { MeetingAgendaService } from './meeting-agenda.service';
import { ReadinessService } from './readiness.service';
import { SearchService } from './search.service';
import { publicSitemapPaths, renderSitemapXml } from './sitemap';

@Controller()
export class PublicController {
  constructor(
    private readonly store: PublicStore,
    private readonly readiness: ReadinessService,
    private readonly searchService: SearchService,
    private readonly caseBriefs: CaseBriefService,
    private readonly meetingAgendas: MeetingAgendaService,
  ) {}

  @Get('health')
  health() {
    return {
      ok: true,
      phase: 26,
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

  @Get('board/seats')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  async seats() {
    return {
      seats: await this.store.listSeats(),
      apply: this.store.meta().applyForBoard,
      note: 'Roster terms marked “confirm with Clerk” are placeholders until borough appointment records are mirrored.',
    };
  }
}
