import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../phase2/auth.guard';
import { Roles, RolesGuard } from '../phase2/roles.guard';
import { IngestQueueService } from './ingest.queue';
import { IngestStore } from './ingest.store';
import type { IngestSourceId } from './ingest.types';

const SOURCES: IngestSourceId[] = [
  'clerk_agendas',
  'borough_gis',
  'nrhp_seed',
  'ktnport_ships',
  'embedding_refresh',
  'meeting_summaries',
];

@Controller('ingest')
@UseGuards(AuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
export class IngestController {
  constructor(
    private readonly store: IngestStore,
    private readonly queue: IngestQueueService,
  ) {}

  @Get('status')
  @Header('Cache-Control', 'no-store')
  status() {
    return {
      queue: this.queue.status(),
      sources: this.store.listSources(),
      recentRuns: this.store.listRuns(30),
      policy: {
        robots:
          'Never scrape borough.ketchikan.ak.us against robots.txt. Prefer Clerk feeds, kgbak.us CivicPlus, or ArcGIS REST.',
        askFirst: 'Email the Platting/Zoning Clerk before adversarial-looking automation.',
        fanout: 'Watermark diffs fan out to subscriptions / RSS when the docket changes.',
      },
    };
  }

  @Post('run/:sourceId')
  async runOne(@Param('sourceId') sourceId: string, @CurrentUser() user: { email: string }) {
    if (!SOURCES.includes(sourceId as IngestSourceId)) {
      throw new BadRequestException(`Unknown source. Valid: ${SOURCES.join(', ')}`);
    }
    const result = await this.queue.enqueue(sourceId as IngestSourceId);
    return { ...result, requestedBy: user.email };
  }

  @Post('run-all')
  async runAll(@CurrentUser() user: { email: string }) {
    const results = await this.queue.enqueueAll();
    return { requestedBy: user.email, results };
  }
}
