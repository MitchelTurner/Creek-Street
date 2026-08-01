import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditStore } from '../compliance/audit.store';
import { AuthGuard, CurrentUser } from '../phase2/auth.guard';
import { Roles, RolesGuard } from '../phase2/roles.guard';
import { PublicStore } from '../store/public.store';
import { AdminDashboardService } from './admin-dashboard.service';
import { OpsAgingService } from './ops-aging.service';
import { OpsBriefService } from './ops-brief.service';
import { OpsClaimService, parseClaimKind } from './ops-claim.service';
import { OpsSchedulerService } from './ops-scheduler.service';

@Controller('ops')
@UseGuards(AuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
export class AdminController {
  constructor(
    private readonly adminDashboard: AdminDashboardService,
    private readonly opsBrief: OpsBriefService,
    private readonly opsAging: OpsAgingService,
    private readonly opsScheduler: OpsSchedulerService,
    private readonly opsClaims: OpsClaimService,
    private readonly audit: AuditStore,
    private readonly publicStore: PublicStore,
  ) {}

  @Get('dashboard')
  @Header('Cache-Control', 'no-store')
  getDashboard() {
    return this.adminDashboard.snapshot();
  }

  @Get('queue')
  @Header('Cache-Control', 'no-store')
  getQueue() {
    return this.opsAging.enrichedQueue();
  }

  @Get('aging')
  @Header('Cache-Control', 'no-store')
  getAging() {
    return this.opsAging.snapshot();
  }

  @Get('brief/preview')
  @Header('Cache-Control', 'no-store')
  briefPreview(
    @Headers('host') host?: string,
    @Headers('x-forwarded-host') xfHost?: string,
    @Headers('x-forwarded-proto') xfProto?: string,
  ) {
    const h = xfHost || host || 'creek-street.local';
    const proto = xfProto || 'https';
    const origin = process.env.PUBLIC_WEB_ORIGIN || `${proto}://${h}`;
    return this.opsBrief.preview(origin);
  }

  @Get('brief/last')
  @Header('Cache-Control', 'no-store')
  briefLast() {
    return { last: this.opsBrief.lastBrief() };
  }

  @Post('brief/send')
  @Header('Cache-Control', 'no-store')
  async briefSend(
    @CurrentUser() user: { id: string; email: string; role: string },
    @Headers('host') host?: string,
    @Headers('x-forwarded-host') xfHost?: string,
    @Headers('x-forwarded-proto') xfProto?: string,
  ) {
    const h = xfHost || host || 'creek-street.local';
    const proto = xfProto || 'https';
    const origin = process.env.PUBLIC_WEB_ORIGIN || `${proto}://${h}`;
    const result = await this.opsBrief.send(origin);
    this.audit.record({
      action: 'ops.brief.send',
      actor: user,
      resourceType: 'ops_brief',
      resourceId: 'staff',
      summary: `Ops brief sent by ${user.email} to ${result.recipients} staff recipient(s)`,
      meta: { mode: result.mode },
    });
    return result;
  }

  @Get('alerts/preview')
  @Header('Cache-Control', 'no-store')
  alertPreview(
    @Headers('host') host?: string,
    @Headers('x-forwarded-host') xfHost?: string,
    @Headers('x-forwarded-proto') xfProto?: string,
  ) {
    const h = xfHost || host || 'creek-street.local';
    const proto = xfProto || 'https';
    const origin = process.env.PUBLIC_WEB_ORIGIN || `${proto}://${h}`;
    return this.opsAging.previewAlert(origin);
  }

  @Post('alerts/send')
  @Header('Cache-Control', 'no-store')
  async alertSend(
    @CurrentUser() user: { id: string; email: string; role: string },
    @Query('force') force?: string,
    @Headers('host') host?: string,
    @Headers('x-forwarded-host') xfHost?: string,
    @Headers('x-forwarded-proto') xfProto?: string,
  ) {
    const h = xfHost || host || 'creek-street.local';
    const proto = xfProto || 'https';
    const origin = process.env.PUBLIC_WEB_ORIGIN || `${proto}://${h}`;
    const result = await this.opsAging.sendAlert({
      origin,
      force: force === '1' || force === 'true',
    });
    if (result.sent) {
      this.audit.record({
        action: 'ops.alert.send',
        actor: user,
        resourceType: 'ops_alert',
        resourceId: 'stale_queue',
        summary: `Stale queue alert sent by ${user.email} to ${result.recipients} staff (${result.staleTotal} stale)`,
        meta: { mode: result.mode, staleTotal: result.staleTotal },
      });
    }
    return result;
  }

  @Get('scheduler')
  @Header('Cache-Control', 'no-store')
  schedulerStatus() {
    return this.opsScheduler.status();
  }

  @Post('scheduler/enable')
  @Header('Cache-Control', 'no-store')
  schedulerEnable(@CurrentUser() user: { id: string; email: string; role: string }) {
    const status = this.opsScheduler.enable();
    this.audit.record({
      action: 'ops.alert.scheduler.enable',
      actor: user,
      resourceType: 'ops_scheduler',
      resourceId: 'stale_alert',
      summary: `Ops alert scheduler enabled by ${user.email}`,
      meta: { tickHours: status.tickHours },
    });
    return status;
  }

  @Post('scheduler/disable')
  @Header('Cache-Control', 'no-store')
  schedulerDisable(@CurrentUser() user: { id: string; email: string; role: string }) {
    const status = this.opsScheduler.disable();
    this.audit.record({
      action: 'ops.alert.scheduler.disable',
      actor: user,
      resourceType: 'ops_scheduler',
      resourceId: 'stale_alert',
      summary: `Ops alert scheduler disabled by ${user.email}`,
    });
    return status;
  }

  @Post('scheduler/tick')
  @Header('Cache-Control', 'no-store')
  async schedulerTick(
    @CurrentUser() user: { id: string; email: string; role: string },
    @Headers('host') host?: string,
    @Headers('x-forwarded-host') xfHost?: string,
    @Headers('x-forwarded-proto') xfProto?: string,
  ) {
    const h = xfHost || host || 'creek-street.local';
    const proto = xfProto || 'https';
    const origin = process.env.PUBLIC_WEB_ORIGIN || `${proto}://${h}`;
    return this.opsScheduler.tick({
      triggered: 'manual',
      origin,
      actor: user,
    });
  }

  @Post('queue/:kind/:id/claim')
  @Header('Cache-Control', 'no-store')
  claimItem(
    @CurrentUser() user: { id: string; email: string; role: string },
    @Param('kind') kindRaw: string,
    @Param('id') id: string,
  ) {
    const kind = parseClaimKind(kindRaw);
    const claim = this.opsClaims.claim(kind, id, user);
    this.audit.record({
      action: 'ops.queue.claim',
      actor: user,
      resourceType: `queue_${kind}`,
      resourceId: id,
      summary: `${kind} ${id} claimed by ${user.email}`,
      meta: { expiresAt: claim?.expiresAt },
    });
    return { claim };
  }

  @Post('queue/:kind/:id/release')
  @Header('Cache-Control', 'no-store')
  releaseItem(
    @CurrentUser() user: { id: string; email: string; role: string },
    @Param('kind') kindRaw: string,
    @Param('id') id: string,
    @Query('force') force?: string,
  ) {
    const kind = parseClaimKind(kindRaw);
    const result = this.opsClaims.release(kind, id, user, {
      force: force === '1' || force === 'true',
    });
    this.audit.record({
      action: 'ops.queue.release',
      actor: user,
      resourceType: `queue_${kind}`,
      resourceId: id,
      summary: `${kind} ${id} released by ${user.email}${result.released ? '' : ' (no claim)'}`,
      meta: { force: force === '1' || force === 'true', released: result.released },
    });
    return result;
  }

  /** Staff map pin nudge — updates Structure.centroid (and a small parcel footprint). */
  @Patch('structures/:slug/centroid')
  @Header('Cache-Control', 'no-store')
  async updateStructureCentroid(
    @CurrentUser() user: { id: string; email: string; role: string },
    @Param('slug') slug: string,
    @Body() body: { lng?: number; lat?: number },
  ) {
    const lng = Number(body?.lng);
    const lat = Number(body?.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      throw new BadRequestException('lng and lat are required numbers');
    }
    const row = await this.publicStore.updateStructureCentroid(slug, lng, lat);
    if (!row) throw new NotFoundException('Structure not found or coordinates out of range');
    this.audit.record({
      action: 'map.structure_centroid_update',
      actor: user,
      resourceType: 'structure',
      resourceId: row.id,
      summary: `${user.email} moved pin for ${row.publicSlug} to ${lng.toFixed(5)}, ${lat.toFixed(5)}`,
      meta: { slug: row.publicSlug, lng, lat, previous: row.previous },
    });
    return {
      ...row,
      mapApi: '/api/map',
      note: 'Pin location updated on the public district map. Confirm against borough GIS when available.',
    };
  }
}
