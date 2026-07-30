import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module';
import { Phase4Module } from '../phase4/phase4.module';
import { CaseBriefService } from './case-brief.service';
import { DecisionSheetService } from './decision-sheet.service';
import { MeetingAgendaService } from './meeting-agenda.service';
import { MeetingSummarySheetService } from './meeting-summary-sheet.service';
import { OpenDataController } from './opendata.controller';
import { PublicController } from './public.controller';
import { ReadinessService } from './readiness.service';
import { SearchService } from './search.service';

@Module({
  imports: [GeoModule, Phase4Module],
  controllers: [PublicController, OpenDataController],
  providers: [
    ReadinessService,
    SearchService,
    CaseBriefService,
    MeetingAgendaService,
    MeetingSummarySheetService,
    DecisionSheetService,
  ],
  exports: [
    ReadinessService,
    CaseBriefService,
    MeetingAgendaService,
    MeetingSummarySheetService,
    DecisionSheetService,
  ],
})
export class PublicModule {}
