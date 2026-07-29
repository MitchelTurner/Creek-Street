import { Injectable, Logger } from '@nestjs/common';
import { applications } from '../data/phase0-seed';
import { MailService } from '../ops/mail.service';
import { ApplicantStore } from '../phase2/applicant.store';

export type NotifyEvent = {
  topic: string;
  title: string;
  body: string;
  link?: string;
  at: string;
};

/**
 * Subscription delivery — email via MailService (SMTP or stub), RSS pull-based.
 */
@Injectable()
export class SubscriptionNotifyService {
  private readonly log = new Logger(SubscriptionNotifyService.name);
  private deliveries: Array<
    NotifyEvent & { email: string; channel: string; id: string; mailMode?: string }
  > = [];

  constructor(
    private readonly applicants: ApplicantStore,
    private readonly mail: MailService,
  ) {}

  listDeliveries(limit = 50) {
    return this.deliveries.slice(0, limit);
  }

  /** Fan out ingest topics (e.g. subscriptions.district_wide, rss.feeds). */
  async fanout(topics: string[], context?: { sourceId?: string; message?: string }) {
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
      notified = await this.deliver(event);
    }
    return { notified, topics, event };
  }

  private async deliver(event: NotifyEvent) {
    const emailSubs = this.applicants.listConfirmedEmailSubscriptions();
    const origin = process.env.PUBLIC_WEB_ORIGIN ?? 'https://creek-street.local';
    for (const sub of emailSubs) {
      const text = [
        event.body,
        '',
        `Open the docket: ${origin}${event.link ?? '/docket'}`,
        '',
        'Creek Street Design Review Hub — Mitchel Turner Dev, LLC (not a borough property).',
        'To stop alerts, use your unsubscribe token from the subscriptions page.',
      ].join('\n');

      const mailResult = await this.mail.send({
        to: sub.email,
        subject: event.title,
        text,
      });

      this.deliveries.unshift({
        id: `dlv_${this.deliveries.length + 1}`,
        email: sub.email,
        channel: 'EMAIL',
        mailMode: mailResult.mode,
        ...event,
      });
      if (!mailResult.accepted) {
        this.log.warn(`Delivery failed to=${sub.email}: ${mailResult.error}`);
      }
    }

    const rssCount = this.applicants.rssFeed().length;
    if (rssCount > 0) {
      const publicCount = applications.filter((a) => a.status !== 'DRAFT').length;
      this.deliveries.unshift({
        id: `dlv_rss_${this.deliveries.length + 1}`,
        email: 'rss@local',
        channel: 'RSS',
        mailMode: 'pull',
        ...event,
        body: `${event.body} (${rssCount} RSS feeds; ${publicCount} public applications).`,
      });
    }

    return emailSubs.length;
  }
}
