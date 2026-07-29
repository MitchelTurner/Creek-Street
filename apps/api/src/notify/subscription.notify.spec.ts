import { describe, expect, it } from 'vitest';
import { ApplicantStore } from '../phase2/applicant.store';
import { SubscriptionNotifyService } from './subscription.notify';

describe('SubscriptionNotifyService', () => {
  it('fans out email stubs for confirmed subscribers', () => {
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
    const notify = new SubscriptionNotifyService(store);
    const result = notify.fanout(['subscriptions.district_wide', 'rss.feeds'], {
      sourceId: 'clerk_agendas',
      message: 'Docket watermark advanced',
    });
    expect(result.notified).toBe(1);
    expect(notify.listDeliveries()[0]?.email).toBe('neighbor@example.com');
  });

  it('no-ops when fanout topics are empty', () => {
    const notify = new SubscriptionNotifyService(new ApplicantStore());
    expect(notify.fanout([]).notified).toBe(0);
  });
});
