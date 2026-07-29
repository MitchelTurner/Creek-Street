import { Global, Module } from '@nestjs/common';
import { Phase3Module } from '../phase3/phase3.module';
import { AuditStore } from './audit.store';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';

@Global()
@Module({
  imports: [Phase3Module],
  controllers: [ComplianceController],
  providers: [AuditStore, ComplianceService],
  exports: [AuditStore, ComplianceService],
})
export class ComplianceModule {}
