import { describe, expect, it } from 'vitest';
import { MailService } from '../ops/mail.service';
import { ApplicantStore } from '../phase2/applicant.store';
import { DigestService } from './digest.service';

describe('DigestService', () => {
  it('builds a digest body with docket and calendar link', () => {
    const body = new DigestService(new ApplicantStore(), new MailService()).buildBody(
      'https://example.test',
    );
    expect(body).toContain('weekly digest');
    expect(body).toContain('https://example.test/api/meetings.ics');
    expect(body.toLowerCase()).not.toContain('must never be public');
  });

  it('sends to confirmed email subscribers', async () => {
    delete process.env.SMTP_URL;
    const store = new ApplicantStore();
    store.createSubscription({
      userId: null,
      email: 'owner@example.com',
      scope: 'DISTRICT_WIDE',
      parcelId: null,
      centerPoint: null,
      radiusMeters: null,
      projectTypes: [],
      channel: 'EMAIL',
    });
    const digest = new DigestService(store, new MailService());
    const result = await digest.sendWeekly('https://example.test');
    expect(result.recipients).toBe(1);
    expect(result.mode).toBe('stub');
    expect(digest.lastDigest()?.recipients).toBe(1);
  });
});
