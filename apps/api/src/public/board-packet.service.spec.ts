import { describe, expect, it } from 'vitest';
import { MeetingPacketService } from '../packets/meeting-packet.service';
import { BoardPacketService } from './board-packet.service';

describe('BoardPacketService', () => {
  const packets = new MeetingPacketService();
  const svc = new BoardPacketService(packets);

  it('resolves the upcoming scheduled meeting when present', () => {
    const row = svc.resolvePublicMeeting();
    expect(row.meeting.id).toBeTruthy();
    expect(row.pdfPath).toBe('/api/board/packet.pdf');
    expect(['upcoming', 'recent']).toContain(row.mode);
  });

  it('builds a non-empty PDF buffer', async () => {
    const { buffer, meetingId } = await svc.buildNextPdf();
    expect(meetingId).toBeTruthy();
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
