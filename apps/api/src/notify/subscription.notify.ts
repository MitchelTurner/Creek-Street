import { Injectable, Logger } from '@nestjs/common';
import { applications } from '../data/phase0-seed';
import { ApplicantStore } from '../phase2/applicant.store';

export type NotifyEvent = {
  topic: string;
  title: string;
  body: string;
  link?: string;
  at: string;
};

/**
 * Phase 6 subscription delivery stub.
 * Logs email payloads (wire SMTP_URL later). RSS stays pull-based;
 * fanout records a delivery log for admin visibility.
 */
@Injectable()
export class SubscriptionNotifyService {
  private readonly log = new Logger(SubscriptionNotifyService.name);
  private deliveries: Array<NotifyEvent & { email: string; channel: string; id: string }> = [];

  constructor(private readonly applicants: ApplicantStore) {}

  listDeliveries(limit = 50) {
    return this.deliveries.slice(0, limit);
  }

  /** Fan out ingest topics (e.g. subscriptions.district_wide, rss.feeds). */
  fanout(topics: string[], context?: { sourceId?: string; message?: string }) {
    if (!topics.length) return { notified: 0, topics };

    const event: NotifyEvent = {
      topic: topics.join(','),
      title: context?.sourceId
        ? `Creek Street update — ${context.sourceId}`
        : 'Creek Street docket update',
      body:
        context?.message ??
        'A mirrored source watermark advanced. Check the public docket for details.',
      link: '/docket',
      at: new Date().toISOString(),
    };

    let notified = 0;
    const shouldNotify = topics.some(
      (t) => t.startsWith('subscriptions.') || t === 'rss.feeds',
    );
    if (shouldNotify) {
      notified = this.deliver(event);
    }
    return { notified, topics, event };
  }

  private deliver(event: NotifyEvent) {
    const emailSubs = this.applicants.listConfirmedEmailSubscriptions();
    for (const sub of emailSubs) {
      this.deliveries.unshift({
        id: `dlv_${this.deliveries.length + 1}`,
        email: sub.email,
        channel: 'EMAIL',
        ...event,
      });
      this.log.log(`[email-stub] to=${sub.email} subject="${event.title}"`);
    }

    const rssCount = this.applicants.rssFeed().length;
    if (rssCount > 0) {
      const publicCount = applications.filter((a) => a.status !== 'DRAFT').length;
      this.deliveries.unshift({
        id: `dlv_rss_${this.deliveries.length + 1}`,
        email: 'rss@local',
        channel: 'RSS',
        ...event,
        body: `${event.body} (${rssCount} RSS feeds; ${publicCount} public applications).`,
      });
    }

    return emailSubs.length;
  }
}
