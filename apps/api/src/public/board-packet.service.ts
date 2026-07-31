import { Injectable, NotFoundException } from '@nestjs/common';
import { meetings } from '../data/phase0-seed';
import { MeetingPacketService } from '../packets/meeting-packet.service';

/**
 * Phase 32 — shortcut to the next (or most recent) public board packet PDF.
 * Uses seed/mirrored meetings only; DRAFT never appears in MeetingPacketService.
 */
@Injectable()
export class BoardPacketService {
  constructor(private readonly packets: MeetingPacketService) {}

  /** Next upcoming SCHEDULED public meeting, or most recent held if none upcoming. */
  resolvePublicMeeting() {
    const now = Date.now();
    const upcoming = [...meetings]
      .filter((m) => m.status === 'SCHEDULED' && Date.parse(m.scheduledAt) >= now)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];
    if (upcoming) {
      return {
        meeting: this.summarize(upcoming),
        mode: 'upcoming' as const,
        pdfPath: `/api/board/packet.pdf`,
        meetingPdfPath: `/api/meetings/${upcoming.id}/packet.pdf`,
      };
    }

    const recent = [...meetings]
      .filter((m) => m.status !== 'CANCELLED')
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0];
    if (!recent) throw new NotFoundException('No published meetings available');
    return {
      meeting: this.summarize(recent),
      mode: 'recent' as const,
      pdfPath: `/api/board/packet.pdf`,
      meetingPdfPath: `/api/meetings/${recent.id}/packet.pdf`,
    };
  }

  async buildNextPdf(): Promise<{ buffer: Buffer; meetingId: string; scheduledAt: string }> {
    const { meeting } = this.resolvePublicMeeting();
    const buffer = await this.packets.buildPdf(meeting.id);
    if (!buffer) throw new NotFoundException('Meeting packet not available');
    return { buffer, meetingId: meeting.id, scheduledAt: meeting.scheduledAt };
  }

  private summarize(m: (typeof meetings)[number]) {
    return {
      id: m.id,
      scheduledAt: m.scheduledAt,
      location: m.location,
      status: m.status,
      agendaItemCount: m.agendaItems.length,
      ui: `/meetings/${m.id}`,
    };
  }
}
