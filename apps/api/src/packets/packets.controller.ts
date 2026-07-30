import { Controller, Get, Header, NotFoundException, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuditStore } from '../compliance/audit.store';
import { AuthGuard, CurrentUser } from '../phase2/auth.guard';
import { Roles, RolesGuard } from '../phase2/roles.guard';
import { MeetingPacketService } from './meeting-packet.service';

@Controller()
export class PacketsController {
  constructor(
    private readonly packets: MeetingPacketService,
    private readonly audit: AuditStore,
  ) {}

  /** Public mirrored packet — no auth. Never includes private notes or DRAFTs. */
  @Get('meetings/:id/packet.pdf')
  @Header('Cache-Control', 'public, max-age=60')
  async publicPacket(@Param('id') id: string, @Res() res: Response) {
    const buf = await this.packets.buildPdf(id);
    if (!buf) throw new NotFoundException('Meeting not found');
    const meta = this.packets.meta(id)!;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="creek-street-meeting-${meta.meetingId}.pdf"`,
    );
    res.send(buf);
  }

  @Get('meetings/:id/packet')
  @Header('Cache-Control', 'public, max-age=60')
  packetMeta(@Param('id') id: string) {
    const meta = this.packets.meta(id);
    if (!meta) throw new NotFoundException('Meeting not found');
    return {
      ...meta,
      pdfPath: `/api/meetings/${id}/packet.pdf`,
      note: 'Mirrored public facts only. MemberNotes and DRAFT applications are never included.',
    };
  }

  /** Board/staff download with audit trail (same public content + logged access). */
  @Get('board/meetings/:id/packet.pdf')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  async boardPacket(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string; role: string },
    @Res() res: Response,
  ) {
    const buf = await this.packets.buildPdf(id);
    if (!buf) throw new NotFoundException('Meeting not found');
    this.audit.record({
      action: 'meeting.packet_download',
      actor: user,
      resourceType: 'meeting',
      resourceId: id,
      summary: `Meeting packet downloaded by ${user.email}`,
    });
    const meta = this.packets.meta(id)!;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="creek-street-board-packet-${meta.meetingId}.pdf"`,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(buf);
  }
}
