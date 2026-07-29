import { Body, Controller, Get, Header, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { applications, decisions } from '../data/phase0-seed';
import { Phase1Service, type PermitQuery } from './phase1.service';

@Controller()
export class Phase1Controller {
  constructor(private readonly phase1: Phase1Service) {}

  @Get('triage/flows')
  @Header('Cache-Control', 'public, max-age=300')
  triageFlows() {
    return this.phase1.listTriageFlows();
  }

  @Get('triage/flows/:projectType')
  @Header('Cache-Control', 'public, max-age=300')
  triageFlow(@Param('projectType') projectType: string) {
    const flow = this.phase1.getTriageFlow(projectType.toUpperCase());
    if (!flow) throw new NotFoundException('No published triage flow for this project type');
    return flow;
  }

  @Post('triage/evaluate')
  evaluate(
    @Body()
    body: {
      projectType: string;
      answers?: Record<string, string>;
    },
  ) {
    const result = this.phase1.evaluateTriage(body.projectType?.toUpperCase(), body.answers ?? {});
    if (!result) throw new NotFoundException('No published triage flow for this project type');
    return result;
  }

  @Get('permits/agencies')
  @Header('Cache-Control', 'public, max-age=300')
  agencies() {
    return this.phase1.listAgencies();
  }

  @Get('permits/triggers')
  @Header('Cache-Control', 'public, max-age=120')
  triggers(
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
    @Query('includeUnverified') includeUnverified?: string,
  ) {
    const q: PermitQuery = {
      inHdZone: inHdZone === 'true',
      exteriorChange: exteriorChange === 'true',
      overWater: overWater === 'true',
      inWater: inWater === 'true',
      substructure: substructure === 'true',
      groundDisturbing: groundDisturbing === 'true',
      structural: structural === 'true',
      occupancyChange: occupancyChange === 'true',
      fill: fill === 'true',
      wastewater: wastewater === 'true',
      federalNexus: federalNexus === 'true',
      includeUnverified: includeUnverified === 'true',
    };
    return this.phase1.matchPermitTriggers(q);
  }

  @Get('precedents')
  @Header('Cache-Control', 'public, max-age=120')
  precedents(@Query('criterion') criterion?: string) {
    return this.phase1.listPrecedents(criterion?.toUpperCase());
  }

  @Get('precedents/similar')
  similarGet(@Query('q') q?: string, @Query('limit') limit?: string) {
    if (!q?.trim()) return { query: '', results: [], count: 0 };
    return this.phase1.similarApplications(q, limit ? Number(limit) : 5);
  }

  @Post('precedents/similar')
  similarPost(@Body() body: { text?: string; applicationId?: string; limit?: number }) {
    let text = body.text?.trim() ?? '';
    if (body.applicationId && !body.text) {
      const app = applications.find((a) => a.id === body.applicationId);
      if (!app) throw new NotFoundException('Application not found');
      const decs = decisions.filter((d) => d.applicationId === app.id);
      text = [app.description, ...decs.map((d) => d.recommendation)].join(' ');
    }
    if (!text) return { query: '', results: [], count: 0 };
    const result = this.phase1.similarApplications(text, body.limit ?? 5);
    if (body.applicationId) {
      result.results = result.results.filter((r) => r.application.id !== body.applicationId);
    }
    return result;
  }
}
