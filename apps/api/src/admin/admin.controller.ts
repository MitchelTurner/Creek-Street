import { Controller, Get, Header, Headers, Post, UseGuards } from '@nestjs/common';
import { AuditStore } from '../compliance/audit.store';
import { AuthGuard, CurrentUser } from '../phase2/auth.guard';
import { Roles, RolesGuard } from '../phase2/roles.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { OpsBriefService } from './ops-brief.service';
import { OpsQueueService } from './ops-queue.service';

@Controller('ops')
@UseGuards(AuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
export class AdminController {
  constructor(
    private readonly adminDashboard: AdminDashboardService,
    private readonly opsQueue: OpsQueueService,
    private readonly opsBrief: OpsBriefService,
    private readonly audit: AuditStore,
  ) {}

  @Get('dashboard')
  @Header('Cache-Control', 'no-store')
  getDashboard() {
    return this.adminDashboard.snapshot();
  }

  @Get('queue')
  @Header('Cache-Control', 'no-store')
  getQueue() {
    return this.opsQueue.snapshot();
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
}
