import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module';
import { PacketsModule } from '../packets/packets.module';
import { Phase1Module } from '../phase1/phase1.module';
import { Phase2Module } from '../phase2/phase2.module';
import { Phase4Module } from '../phase4/phase4.module';
import { AiIdeasService } from './ai-ideas.service';
import { BoardPacketService } from './board-packet.service';
import { CaseBriefService } from './case-brief.service';
import { CivicIdeasService } from './civic-ideas.service';
import { CriterionAtlasService } from './criterion-atlas.service';
import { DecisionSheetService } from './decision-sheet.service';
import { FilingPlanService } from './filing-plan.service';
import { MeetingAgendaService } from './meeting-agenda.service';
import { MeetingSummarySheetService } from './meeting-summary-sheet.service';
import { NoticePacketService } from './notice-packet.service';
import { OpenDataController } from './opendata.controller';
import { PrecedentCompareService } from './precedent-compare.service';
import { PublicController } from './public.controller';
import { ReadinessService } from './readiness.service';
import { SearchService } from './search.service';
import { StructureSheetService } from './structure-sheet.service';

@Module({
  imports: [GeoModule, Phase1Module, Phase2Module, Phase4Module, PacketsModule],
  controllers: [PublicController, OpenDataController],
  providers: [
    ReadinessService,
    SearchService,
    CaseBriefService,
    MeetingAgendaService,
    MeetingSummarySheetService,
    DecisionSheetService,
    CriterionAtlasService,
    StructureSheetService,
    FilingPlanService,
    NoticePacketService,
    PrecedentCompareService,
    BoardPacketService,
    CivicIdeasService,
    AiIdeasService,
  ],
  exports: [
    ReadinessService,
    CaseBriefService,
    MeetingAgendaService,
    MeetingSummarySheetService,
    DecisionSheetService,
    CriterionAtlasService,
    StructureSheetService,
    FilingPlanService,
    NoticePacketService,
    PrecedentCompareService,
    BoardPacketService,
    CivicIdeasService,
    AiIdeasService,
  ],
})
export class PublicModule {}
