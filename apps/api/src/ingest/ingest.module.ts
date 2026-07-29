import { Module } from '@nestjs/common';
import { Phase2Module } from '../phase2/phase2.module';
import { IngestController } from './ingest.controller';
import { IngestQueueService } from './ingest.queue';
import { IngestStore } from './ingest.store';

@Module({
  imports: [Phase2Module],
  controllers: [IngestController],
  providers: [IngestStore, IngestQueueService],
  exports: [IngestStore, IngestQueueService],
})
export class IngestModule {}
