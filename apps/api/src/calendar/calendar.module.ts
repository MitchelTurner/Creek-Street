import { Module } from '@nestjs/common';
import { Phase2Module } from '../phase2/phase2.module';
import { CalendarController } from './calendar.controller';
import { DigestService } from './digest.service';
import { IcalService } from './ical.service';

@Module({
  imports: [Phase2Module],
  controllers: [CalendarController],
  providers: [IcalService, DigestService],
  exports: [IcalService, DigestService],
})
export class CalendarModule {}
