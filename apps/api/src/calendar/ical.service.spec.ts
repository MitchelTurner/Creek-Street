import { describe, expect, it } from 'vitest';
import { IcalService } from './ical.service';

describe('IcalService', () => {
  it('emits a VCALENDAR with VEVENT rows and no DRAFT leakage', () => {
    const ics = new IcalService().buildFeed('https://example.test');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('Creek Street Design Review Board');
    expect(ics).toContain('https://example.test/meetings');
    expect(ics.toLowerCase()).not.toContain('must never be public');
    expect(ics).toContain('END:VCALENDAR');
  });
});
