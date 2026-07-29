import { describe, expect, it } from 'vitest';
import { MailService } from '../ops/mail.service';
import { ApplicantStore } from '../phase2/applicant.store';
import { SubscriptionNotifyService } from './subscription.notify';

describe('SubscriptionNotifyService', () => {
  it('fans out email via MailService for confirmed subscribers', async () => {
    delete process.env.SMTP_URL;
    const store = new ApplicantStore();
    store.createSubscription({
      userId: null,
      email: 'neighbor@example.com',
      scope: 'DISTRICT_WIDE',
      parcelId: null,
      centerPoint: null,
      radiusMeters: null,
      projectTypes: [],
      channel: 'EMAIL',
    });
    const notify = new SubscriptionNotifyService(store, new MailService());
    const result = await notify.fanout(['subscriptions.district_wide', 'rss.feeds'], {
      sourceId: 'clerk_agendas',
      message: 'Docket watermark advanced',
    });
    expect(result.notified).toBe(1);
    expect(notify.listDeliveries()[0]?.email).toBe('neighbor@example.com');
    expect(notify.listDeliveries()[0]?.mailMode).toBe('stub');
  });

  it('no-ops when fanout topics are empty', async () => {
    const notify = new SubscriptionNotifyService(new ApplicantStore(), new MailService());
    expect((await notify.fanout([])).notified).toBe(0);
  });
});
