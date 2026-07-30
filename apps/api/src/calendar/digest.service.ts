import { Injectable, Logger } from '@nestjs/common';
import { applications, meetings } from '../data/phase0-seed';
import { MailService } from '../ops/mail.service';
import { ApplicantStore } from '../phase2/applicant.store';
import { PUBLIC_STATUS_SET } from '../store/public-statuses';

export type DigestResult = {
  at: string;
  recipients: number;
  mode: string;
  subject: string;
  preview: string;
};

/**
 * Phase 14 — weekly (or on-demand) docket/meeting digest for EMAIL subscribers.
 */
@Injectable()
export class DigestService {
  private readonly log = new Logger(DigestService.name);
  private last: DigestResult | null = null;

  constructor(
    private readonly applicants: ApplicantStore,
    private readonly mail: MailService,
  ) {}

  lastDigest() {
    return this.last;
  }

  buildBody(origin = 'https://creek-street.local') {
    const base = origin.replace(/\/$/, '');
    const publicApps = applications.filter((a) => PUBLIC_STATUS_SET.has(a.status));
    const active = publicApps.filter((a) =>
      ['FILED', 'SCHEDULED', 'BOARD_REVIEWED', 'FORWARDED'].includes(a.status),
    );
    const upcoming = meetings
      .filter((m) => m.status === 'SCHEDULED')
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .slice(0, 5);

    const lines = [
      'Creek Street Design Review — weekly digest',
      '',
      'This is an independent public mirror operated by Mitchel Turner Dev, LLC — not a borough property.',
      'Verify filings and notices against borough records.',
      '',
      `Active public docket items: ${active.length}`,
      ...active.slice(0, 10).map(
        (a) =>
          `• ${a.caseNumber ?? a.id} — ${a.projectType.replace(/_/g, ' ')} (${a.status})`,
      ),
      '',
      'Upcoming mirrored meetings:',
      ...(upcoming.length
        ? upcoming.map(
            (m) =>
              `• ${new Date(m.scheduledAt).toLocaleString('en-US', { timeZone: 'America/Juneau' })} — ${m.location}`,
          )
        : ['• (none scheduled in mirror)']),
      '',
      `Calendar feed: ${base}/api/meetings.ics`,
      `Docket: ${base}/docket`,
      `Meetings: ${base}/meetings`,
      '',
      'Unsubscribe using the token from your subscriptions page.',
    ];
    return lines.join('\n');
  }

  async sendWeekly(origin?: string): Promise<DigestResult> {
    const webOrigin = origin || process.env.PUBLIC_WEB_ORIGIN || 'https://creek-street.local';
    const body = this.buildBody(webOrigin);
    const subject = 'Creek Street Design Review — weekly digest';
    const subs = this.applicants.listConfirmedEmailSubscriptions();
    let sent = 0;
    let mode = 'stub';

    for (const sub of subs) {
      const result = await this.mail.send({
        to: sub.email,
        subject,
        text: body,
      });
      mode = result.mode;
      if (result.accepted) sent += 1;
    }

    this.last = {
      at: new Date().toISOString(),
      recipients: sent,
      mode,
      subject,
      preview: body.slice(0, 280),
    };
    this.log.log(`Weekly digest recipients=${sent} mode=${mode}`);
    return this.last;
  }
}
