import { describe, expect, it } from 'vitest';
import { MeetingAgendaService } from './meeting-agenda.service';

describe('MeetingAgendaService', () => {
  const svc = new MeetingAgendaService();

  it('assembles a scheduled meeting agenda with public case deep-links', () => {
    const out = svc.agenda('mtg_2026_08');
    expect(out).not.toBeNull();
    expect(out!.phase).toBe(26);
    expect(out!.meeting.status).toBe('SCHEDULED');
    expect(out!.outcomes).toBeNull();
    expect(out!.items[0]?.application?.id).toBe('app_sample_pending');
    expect(out!.items[0]?.application?.caseBriefUi).toBe('/docket/app_sample_pending');
    expect(JSON.stringify(out)).not.toContain('app_sample_draft');
    expect(JSON.stringify(out)).not.toContain('must never be public');
  });

  it('links outcomes for HELD meetings and strips AI summary body', () => {
    const out = svc.agenda('mtg_2023_04');
    expect(out!.outcomes?.ui).toBe('/meetings/mtg_2023_04/outcomes');
    expect(out!.items[0]?.application?.caseNumber).toBe('HDR-SAMPLE-001');
    if (out!.summary) {
      expect(out!.summary).not.toHaveProperty('body');
      expect(out!.summary).not.toHaveProperty('perItem');
    }
    expect(JSON.stringify(out)).not.toContain('AI DRAFT SECRET');
  });

  it('returns null for unknown meetings', () => {
    expect(svc.agenda('nope')).toBeNull();
  });

  it('builds a PDF buffer', async () => {
    const buf = await svc.buildPdf('mtg_2026_08');
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf!.length).toBeGreaterThan(200);
    expect(await svc.buildPdf('nope')).toBeNull();
  });
});
