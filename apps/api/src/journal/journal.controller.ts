import {
  Controller,
  Get,
  Header,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../phase2/auth.guard';
import { Roles, RolesGuard } from '../phase2/roles.guard';
import { JournalSchedulerService } from './journal.scheduler';
import { JournalService } from './journal.service';

@Controller('journal')
export class JournalController {
  constructor(
    private readonly journal: JournalService,
    private readonly scheduler: JournalSchedulerService,
  ) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  list(@Query('limit') limit?: string) {
    return this.journal.list(limit ? Number(limit) : 30);
  }

  @Get('status')
  @Header('Cache-Control', 'no-store')
  status() {
    return this.scheduler.status();
  }

  @Get('topics')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  topics() {
    return this.journal.topics();
  }

  @Get('posts/:slug')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  post(@Param('slug') slug: string) {
    return this.journal.getBySlug(slug);
  }

  @Post('publish')
  @Header('Cache-Control', 'no-store')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  publish(
    @Query('force') force?: string,
    @Headers('x-forwarded-proto') proto = 'https',
    @Headers('host') host?: string,
  ) {
    const origin = process.env.PUBLIC_WEB_ORIGIN || (host ? `${proto}://${host}` : undefined);
    return this.journal.ensureDailyPost({
      force: force === '1' || force === 'true',
      origin,
    });
  }

  @Post('digest/weekly')
  @Header('Cache-Control', 'no-store')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  weekly(
    @Query('force') force?: string,
    @Headers('x-forwarded-proto') proto = 'https',
    @Headers('host') host?: string,
  ) {
    const origin = process.env.PUBLIC_WEB_ORIGIN || (host ? `${proto}://${host}` : undefined);
    return this.journal.sendWeeklyHighlights({
      force: force === '1' || force === 'true',
      origin,
    });
  }

  @Post('scheduler/tick')
  @Header('Cache-Control', 'no-store')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  tick(
    @Headers('x-forwarded-proto') proto = 'https',
    @Headers('host') host?: string,
  ) {
    const origin = process.env.PUBLIC_WEB_ORIGIN || (host ? `${proto}://${host}` : undefined);
    return this.scheduler.tick({ triggered: 'manual', origin });
  }

  @Post('scheduler/enable')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  enable() {
    return this.scheduler.enable();
  }

  @Post('scheduler/disable')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  disable() {
    return this.scheduler.disable();
  }
}
