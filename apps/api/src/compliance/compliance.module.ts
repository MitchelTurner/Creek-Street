import { Global, Module } from '@nestjs/common';
import { Phase2Module } from '../phase2/phase2.module';
import { Phase3Module } from '../phase3/phase3.module';
import { AuditStore } from './audit.store';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';

@Global()
@Module({
  // Phase2Module required so AuthGuard/RolesGuard can resolve ApplicantStore
  // (Phase3 imports Phase2 but does not re-export it).
  imports: [Phase2Module, Phase3Module],
  controllers: [ComplianceController],
  providers: [AuditStore, ComplianceService],
  exports: [AuditStore, ComplianceService],
})
export class ComplianceModule {}
