import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { GeoModule } from '../geo/geo.module';
import { IngestModule } from '../ingest/ingest.module';
import { Phase2Module } from '../phase2/phase2.module';
import { Phase4Module } from '../phase4/phase4.module';
import { PublicModule } from '../public/public.module';
import { AdminController } from './admin.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { OpsAgingService } from './ops-aging.service';
import { OpsBriefService } from './ops-brief.service';
import { OpsClaimService } from './ops-claim.service';
import { OpsQueueService } from './ops-queue.service';
import { OpsSchedulerService } from './ops-scheduler.service';

@Module({
  imports: [
    Phase2Module,
    Phase4Module,
    PublicModule,
    CalendarModule,
    ComplianceModule,
    GeoModule,
    IngestModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminDashboardService,
    OpsQueueService,
    OpsClaimService,
    OpsBriefService,
    OpsAgingService,
    OpsSchedulerService,
  ],
})
export class AdminModule {}
