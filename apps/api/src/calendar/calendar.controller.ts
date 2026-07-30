import {
  Controller,
  Get,
  Header,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuditStore } from '../compliance/audit.store';
import { AuthGuard, CurrentUser } from '../phase2/auth.guard';
import { Roles, RolesGuard } from '../phase2/roles.guard';
import { DigestService } from './digest.service';
import { IcalService } from './ical.service';

@Controller()
export class CalendarController {
  constructor(
    private readonly ical: IcalService,
    private readonly digest: DigestService,
    private readonly audit: AuditStore,
  ) {}

  @Get('meetings.ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=300')
  @Header('Content-Disposition', 'inline; filename="creek-street-meetings.ics"')
  meetingsIcs(
    @Headers('host') host?: string,
    @Headers('x-forwarded-host') xfHost?: string,
    @Headers('x-forwarded-proto') xfProto?: string,
  ) {
    const h = xfHost || host || 'creek-street.local';
    const proto = xfProto || 'https';
    const origin = process.env.PUBLIC_WEB_ORIGIN || `${proto}://${h}`;
    return this.ical.buildFeed(origin);
  }

  @Get('digest/preview')
  @Header('Cache-Control', 'no-store')
  digestPreview(
    @Headers('host') host?: string,
    @Headers('x-forwarded-host') xfHost?: string,
    @Headers('x-forwarded-proto') xfProto?: string,
  ) {
    const h = xfHost || host || 'creek-street.local';
    const proto = xfProto || 'https';
    const origin = process.env.PUBLIC_WEB_ORIGIN || `${proto}://${h}`;
    return {
      subject: 'Creek Street Design Review — weekly digest',
      body: this.digest.buildBody(origin),
      last: this.digest.lastDigest(),
      note: 'Preview only. Staff POST /api/digest/send to deliver to confirmed EMAIL subscribers.',
    };
  }

  @Get('digest/last')
  @Header('Cache-Control', 'no-store')
  lastDigest() {
    return { last: this.digest.lastDigest() };
  }

  @Post('digest/send')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  async sendDigest(
    @CurrentUser() user: { id: string; email: string; role: string },
    @Headers('host') host?: string,
    @Headers('x-forwarded-host') xfHost?: string,
    @Headers('x-forwarded-proto') xfProto?: string,
  ) {
    const h = xfHost || host || 'creek-street.local';
    const proto = xfProto || 'https';
    const origin = process.env.PUBLIC_WEB_ORIGIN || `${proto}://${h}`;
    const result = await this.digest.sendWeekly(origin);
    this.audit.record({
      action: 'digest.send',
      actor: user,
      resourceType: 'digest',
      resourceId: 'weekly',
      summary: `Weekly digest sent by ${user.email} to ${result.recipients} recipient(s)`,
      meta: { mode: result.mode },
    });
    return result;
  }

  // ── Phase 23 — post-meeting outcomes digest ───────────────────────────────

  @Get('digest/outcomes/:meetingId/preview')
  @Header('Cache-Control', 'no-store')
  outcomesPreview(
    @Param('meetingId') meetingId: string,
    @Headers('host') host?: string,
    @Headers('x-forwarded-host') xfHost?: string,
    @Headers('x-forwarded-proto') xfProto?: string,
  ) {
    const h = xfHost || host || 'creek-street.local';
    const proto = xfProto || 'https';
    const origin = process.env.PUBLIC_WEB_ORIGIN || `${proto}://${h}`;
    const { subject, body } = this.digest.buildOutcomesBody(meetingId, origin);
    return {
      subject,
      body,
      meetingId,
      last: this.digest.lastOutcomesDigest(),
      note: 'Preview only. Staff POST /api/digest/outcomes/:meetingId/send to deliver to confirmed EMAIL subscribers. HELD meetings only; never includes DRAFT or AI summary body.',
    };
  }

  @Get('digest/outcomes/last')
  @Header('Cache-Control', 'no-store')
  lastOutcomesDigest() {
    return { last: this.digest.lastOutcomesDigest() };
  }

  @Post('digest/outcomes/:meetingId/send')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  async sendOutcomesDigest(
    @Param('meetingId') meetingId: string,
    @CurrentUser() user: { id: string; email: string; role: string },
    @Headers('host') host?: string,
    @Headers('x-forwarded-host') xfHost?: string,
    @Headers('x-forwarded-proto') xfProto?: string,
  ) {
    const h = xfHost || host || 'creek-street.local';
    const proto = xfProto || 'https';
    const origin = process.env.PUBLIC_WEB_ORIGIN || `${proto}://${h}`;
    const result = await this.digest.sendOutcomes(meetingId, origin);
    this.audit.record({
      action: 'digest.outcomes.send',
      actor: user,
      resourceType: 'meeting',
      resourceId: meetingId,
      summary: `Outcomes digest for ${meetingId} sent by ${user.email} to ${result.recipients} recipient(s)`,
      meta: { mode: result.mode },
    });
    return result;
  }
}
