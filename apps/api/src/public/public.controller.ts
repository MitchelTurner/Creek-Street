import { Controller, Get, Header, NotFoundException, Param, Query } from '@nestjs/common';
import { MemoryStore } from '../store/memory.store';

@Controller()
export class PublicController {
  constructor(private readonly store: MemoryStore) {}

  @Get('health')
  health() {
    return { ok: true, phase: 4, store: 'memory' };
  }

  @Get('meta')
  meta() {
    return this.store.meta();
  }

  @Get('map')
  @Header('Cache-Control', 'public, max-age=300')
  map() {
    return this.store.districtMap();
  }

  @Get('structures')
  @Header('Cache-Control', 'public, max-age=300')
  structures(@Query('contributing') contributing?: string) {
    let flag: boolean | undefined;
    if (contributing === 'true') flag = true;
    if (contributing === 'false') flag = false;
    return this.store.listStructures({ contributing: flag });
  }

  @Get('structures/:slug')
  @Header('Cache-Control', 'public, max-age=120')
  structure(@Param('slug') slug: string) {
    const row = this.store.getStructureBySlug(slug);
    if (!row) throw new NotFoundException('Structure not found');
    return row;
  }

  @Get('applications')
  @Header('Cache-Control', 'public, max-age=60')
  applications(@Query('status') status?: string, @Query('q') q?: string) {
    return this.store.listApplications({ status, q });
  }

  @Get('applications/:id')
  application(@Param('id') id: string) {
    const row = this.store.getApplication(id);
    if (!row) throw new NotFoundException('Application not found');
    return row;
  }

  @Get('decisions')
  @Header('Cache-Control', 'public, max-age=120')
  decisions(@Query('q') q?: string) {
    return this.store.listDecisions({ q });
  }

  @Get('meetings')
  @Header('Cache-Control', 'public, max-age=60')
  meetings() {
    return this.store.listMeetings();
  }

  @Get('meetings/:id')
  meeting(@Param('id') id: string) {
    const row = this.store.getMeeting(id);
    if (!row) throw new NotFoundException('Meeting not found');
    return row;
  }

  @Get('guidance')
  @Header('Cache-Control', 'public, max-age=600')
  guidance() {
    return {
      sections: this.store.listGuidance(),
      criteria: this.store.listCriteria(),
      disclaimer:
        'Plain-language guidance summarizes what the code says. It is not a legal conclusion. The Zoning Administrator decides applicability.',
    };
  }

  @Get('board/seats')
  @Header('Cache-Control', 'public, max-age=300')
  seats() {
    return {
      seats: this.store.listSeats(),
      apply: this.store.meta().applyForBoard,
      note: 'Roster terms marked “confirm with Clerk” are placeholders until borough appointment records are mirrored.',
    };
  }
}
