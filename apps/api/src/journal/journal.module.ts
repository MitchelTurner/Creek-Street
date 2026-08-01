import { Module } from '@nestjs/common';
import { JournalController } from './journal.controller';
import { JournalSchedulerService } from './journal.scheduler';
import { JournalService } from './journal.service';

@Module({
  controllers: [JournalController],
  providers: [JournalService, JournalSchedulerService],
  exports: [JournalService, JournalSchedulerService],
})
export class JournalModule {}
