import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../phase2/auth.guard';
import { Roles, RolesGuard } from '../phase2/roles.guard';
import { AuditStore } from './audit.store';
import { ComplianceService } from './compliance.service';

@Controller('compliance')
export class ComplianceController {
  constructor(
    private readonly compliance: ComplianceService,
    private readonly audit: AuditStore,
  ) {}

  /** Public retention / PRA posture — no secrets. */
  @Get('retention')
  @Header('Cache-Control', 'public, max-age=120')
  retention() {
    return this.compliance.retentionPolicy();
  }

  /** Public checklist (missing env names are intentional — ops transparency). */
  @Get('readiness')
  @Header('Cache-Control', 'no-store')
  readiness() {
    const full = this.compliance.readinessChecklist();
    return {
      ...full,
      recentAudit: undefined, // staff-only
    };
  }

  @Get('audit')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @Header('Cache-Control', 'no-store')
  auditLog(
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('actorId') actorId?: string,
  ) {
    return {
      events: this.audit.list({
        limit: limit ? Number(limit) : 100,
        action,
        actorId,
      }),
      note: 'Staff-action audit trail. Access logs (HTTP) are separate stdout JSON lines.',
    };
  }

  @Get('audit/export.json')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  @Header('Cache-Control', 'no-store')
  @Header('Content-Type', 'application/json')
  exportAudit() {
    return {
      exportedAt: new Date().toISOString(),
      events: this.audit.list({ limit: 2000 }),
    };
  }
}
