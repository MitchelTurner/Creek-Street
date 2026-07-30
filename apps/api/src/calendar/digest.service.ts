import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { applications, meetings } from '../data/phase0-seed';
import { MailService } from '../ops/mail.service';
import { ApplicantStore } from '../phase2/applicant.store';
import { MeetingOutcomesService } from '../phase3/meeting-outcomes.service';
import { PUBLIC_STATUS_SET } from '../store/public-statuses';

export type DigestResult = {
  at: string;
  recipients: number;
  mode: string;
  subject: string;
  preview: string;
  kind?: 'weekly' | 'outcomes';
  meetingId?: string;
};

/**
 * Phase 14 — weekly (or on-demand) docket/meeting digest for EMAIL subscribers.
 * Phase 23 — post-meeting outcomes digest for a HELD meeting.
 */
@Injectable()
export class DigestService {
  private readonly log = new Logger(DigestService.name);
  private last: DigestResult | null = null;
  private lastOutcomes: DigestResult | null = null;

  constructor(
    private readonly applicants: ApplicantStore,
    private readonly mail: MailService,
    private readonly outcomes: MeetingOutcomesService,
  ) {}

  lastDigest() {
    return this.last;
  }

  lastOutcomesDigest() {
    return this.lastOutcomes;
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

  buildOutcomesBody(meetingId: string, origin = 'https://creek-street.local') {
    const base = origin.replace(/\/$/, '');
    let data: ReturnType<MeetingOutcomesService['publicOutcomes']>;
    try {
      data = this.outcomes.publicOutcomes(meetingId);
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw e;
    }
    if (!data) throw new NotFoundException('Meeting not found');

    const when = new Date(data.meeting.scheduledAt).toLocaleString('en-US', {
      timeZone: 'America/Juneau',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const itemLines = data.items.map((item) => {
      if (!item.application) {
        return `• ${item.agendaItem.itemNumber}. ${item.agendaItem.title} — ${item.note ?? 'no public case'}`;
      }
      const vote = item.decision
        ? `vote ${item.decision.voteFor ?? '—'}–${item.decision.voteAgainst ?? '—'}; ${item.decision.finalOutcome ?? '—'}`
        : 'no mirrored decision yet';
      return `• ${item.agendaItem.itemNumber}. ${item.application.caseNumber ?? item.application.id} — ${vote}`;
    });

    const lines = [
      'Creek Street Design Review — meeting outcomes',
      '',
      'Mirrored public decisions only. Not an official borough minutes substitute.',
      'Operated by Mitchel Turner Dev, LLC — not a borough property.',
      '',
      `Meeting: ${when} (Alaska)`,
      `Location: ${data.meeting.location}`,
      `Status: ${data.meeting.status}`,
      '',
      'Agenda outcomes:',
      ...(itemLines.length ? itemLines : ['• (no agenda items)']),
      '',
      `Full outcomes: ${base}/meetings/${meetingId}/outcomes`,
      `PDF: ${base}/api/meetings/${meetingId}/outcomes.pdf`,
      `Decisions archive: ${base}/decisions`,
      '',
      'Unsubscribe using the token from your subscriptions page.',
    ];
    return {
      subject: `Creek Street Design Review — outcomes ${data.meeting.scheduledAt.slice(0, 10)}`,
      body: lines.join('\n'),
      meetingId,
    };
  }

  async sendWeekly(origin?: string): Promise<DigestResult> {
    const webOrigin = origin || process.env.PUBLIC_WEB_ORIGIN || 'https://creek-street.local';
    const body = this.buildBody(webOrigin);
    const subject = 'Creek Street Design Review — weekly digest';
    const result = await this.deliver(subject, body);
    this.last = { ...result, kind: 'weekly' };
    this.log.log(`Weekly digest recipients=${result.recipients} mode=${result.mode}`);
    return this.last;
  }

  async sendOutcomes(meetingId: string, origin?: string): Promise<DigestResult> {
    const webOrigin = origin || process.env.PUBLIC_WEB_ORIGIN || 'https://creek-street.local';
    const { subject, body } = this.buildOutcomesBody(meetingId, webOrigin);
    const result = await this.deliver(subject, body);
    this.lastOutcomes = { ...result, kind: 'outcomes', meetingId };
    this.log.log(
      `Outcomes digest meeting=${meetingId} recipients=${result.recipients} mode=${result.mode}`,
    );
    return this.lastOutcomes;
  }

  private async deliver(subject: string, body: string): Promise<DigestResult> {
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

    return {
      at: new Date().toISOString(),
      recipients: sent,
      mode,
      subject,
      preview: body.slice(0, 280),
    };
  }
}
