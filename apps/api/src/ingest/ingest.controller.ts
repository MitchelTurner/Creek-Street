import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuditStore } from '../compliance/audit.store';
import { SubscriptionNotifyService } from '../notify/subscription.notify';
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
    private readonly notify: SubscriptionNotifyService,
    private readonly audit: AuditStore,
  ) {}

  @Get('status')
  @Header('Cache-Control', 'no-store')
  status() {
    return {
      queue: this.queue.status(),
      sources: this.store.listSources(),
      recentRuns: this.store.listRuns(30),
      recentDeliveries: this.notify.listDeliveries(20),
      policy: {
        robots:
          'Never scrape borough.ketchikan.ak.us against robots.txt. Prefer Clerk feeds, kgbak.us CivicPlus, or ArcGIS REST.',
        askFirst: 'Email the Platting/Zoning Clerk before adversarial-looking automation.',
        fanout: 'Watermark diffs fan out to subscriptions / RSS when the docket changes.',
      },
    };
  }

  @Post('run/:sourceId')
  async runOne(
    @Param('sourceId') sourceId: string,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    if (!SOURCES.includes(sourceId as IngestSourceId)) {
      throw new BadRequestException(`Unknown source. Valid: ${SOURCES.join(', ')}`);
    }
    const result = await this.queue.enqueue(sourceId as IngestSourceId);
    this.audit.record({
      action: 'ingest.run',
      actor: user,
      resourceType: 'ingest_source',
      resourceId: sourceId,
      summary: `Ingest run requested for ${sourceId}`,
      meta: { status: result.status },
    });
    return { ...result, requestedBy: user.email };
  }

  @Post('run-all')
  async runAll(@CurrentUser() user: { id: string; email: string; role: string }) {
    const results = await this.queue.enqueueAll();
    this.audit.record({
      action: 'ingest.run_all',
      actor: user,
      resourceType: 'ingest',
      resourceId: null,
      summary: `Ingest run-all requested (${results.length} sources)`,
    });
    return { requestedBy: user.email, results };
  }
}
