import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module';
import { CaseBriefService } from './case-brief.service';
import { MeetingAgendaService } from './meeting-agenda.service';
import { OpenDataController } from './opendata.controller';
import { PublicController } from './public.controller';
import { ReadinessService } from './readiness.service';
import { SearchService } from './search.service';

@Module({
  imports: [GeoModule],
  controllers: [PublicController, OpenDataController],
  providers: [ReadinessService, SearchService, CaseBriefService, MeetingAgendaService],
  exports: [ReadinessService, CaseBriefService, MeetingAgendaService],
})
export class PublicModule {}
