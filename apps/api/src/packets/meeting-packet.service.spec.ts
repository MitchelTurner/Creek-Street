import { describe, expect, it } from 'vitest';
import { MeetingPacketService } from './meeting-packet.service';

describe('MeetingPacketService', () => {
  const svc = new MeetingPacketService();

  it('returns meta for a known meeting', () => {
    const meta = svc.meta('mtg_2026_08');
    expect(meta?.itemCount).toBeGreaterThan(0);
    expect(meta?.status).toBe('SCHEDULED');
  });

  it('builds a PDF buffer that looks like a PDF', async () => {
    const buf = await svc.buildPdf('mtg_2024_02');
    expect(buf).toBeTruthy();
    expect(buf!.subarray(0, 4).toString('utf8')).toBe('%PDF');
    expect(buf!.length).toBeGreaterThan(500);
  });

  it('returns null for unknown meetings', async () => {
    expect(svc.meta('nope')).toBeNull();
    expect(await svc.buildPdf('nope')).toBeNull();
  });
});
