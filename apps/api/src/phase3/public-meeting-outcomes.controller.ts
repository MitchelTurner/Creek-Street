import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { MeetingOutcomesService } from './meeting-outcomes.service';

/**
 * Phase 23 — public (zero-auth) meeting outcomes for HELD meetings.
 * Same mirrored facts as the board brief; never DRAFT / notes / AI body.
 */
@Controller()
export class PublicMeetingOutcomesController {
  constructor(private readonly outcomes: MeetingOutcomesService) {}

  @Get('meetings/:id/outcomes')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  meetingOutcomes(@Param('id') id: string) {
    const row = this.outcomes.publicOutcomes(id);
    if (!row) throw new NotFoundException('Meeting not found');
    return row;
  }

  @Get('meetings/:id/outcomes.pdf')
  @Header('Cache-Control', 'public, max-age=60')
  async meetingOutcomesPdf(@Param('id') id: string, @Res() res: Response) {
    const buf = await this.outcomes.buildPdf(id);
    if (!buf) throw new NotFoundException('Meeting not found');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="creek-street-meeting-outcomes-${id}.pdf"`,
    );
    res.send(buf);
  }
}
