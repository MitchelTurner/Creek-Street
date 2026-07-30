import { BadRequestException, Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { applications, decisions, meetings, structures } from '../data/phase0-seed';
import { Phase4Service } from '../phase4/phase4.service';
import { PUBLIC_STATUS_SET } from '../store/public-statuses';
import { ContractGate } from './contract.gate';

/**
 * Phase 22 — post-meeting outcomes brief for HELD meetings.
 * Mirrored public decisions only. Never DRAFT apps, MemberNotes, or AI summary bodies.
 */
@Injectable()
export class MeetingOutcomesService {
  constructor(
    private readonly phase4: Phase4Service,
    private readonly contract: ContractGate,
  ) {}

  outcomes(meetingId: string) {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return null;
    if (meeting.status !== 'HELD') {
      throw new BadRequestException({
        code: 'MEETING_NOT_HELD',
        message: `Outcomes are only available for HELD meetings (status=${meeting.status}).`,
      });
    }

    const published = this.phase4.publishedSummaryForMeeting(meetingId);
    const summaryMeta = published
      ? {
          id: published.id,
          reviewedAt: published.reviewedAt,
          isPublished: published.isPublished,
          // intentionally omit body / perItem
        }
      : null;

    const items = meeting.agendaItems.map((item) => {
      const app =
        item.applicationId != null
          ? applications.find(
              (a) => a.id === item.applicationId && PUBLIC_STATUS_SET.has(a.status),
            )
          : null;
      const decision = app
        ? (decisions.find((d) => d.applicationId === app.id && d.meetingId === meetingId) ??
          decisions.find((d) => d.applicationId === app.id) ??
          null)
        : null;
      const structure = app
        ? (structures.find((s) => s.id === app.structureId) ?? null)
        : null;

      return {
        agendaItem: {
          id: item.id,
          itemNumber: item.itemNumber,
          title: item.title,
          applicationId: item.applicationId,
        },
        application: app
          ? {
              id: app.id,
              caseNumber: app.caseNumber,
              projectType: app.projectType,
              description: app.description,
              status: app.status,
            }
          : null,
        structure: structure
          ? {
              id: structure.id,
              commonName: structure.commonName,
              addressLabel: structure.addressLabel,
              publicSlug: structure.publicSlug,
            }
          : null,
        decision: decision
          ? {
              id: decision.id,
              recommendation: decision.recommendation,
              conditions: decision.conditions,
              voteFor: decision.voteFor,
              voteAgainst: decision.voteAgainst,
              finalOutcome: decision.finalOutcome,
              decidedAt: decision.decidedAt,
              sourceDocUrl: decision.sourceDocUrl,
            }
          : null,
        note: app
          ? null
          : item.applicationId
            ? 'Linked application not on the public mirror (or still DRAFT).'
            : 'No application linked.',
      };
    });

    return {
      phase: 22,
      meeting: {
        id: meeting.id,
        scheduledAt: meeting.scheduledAt,
        location: meeting.location,
        status: meeting.status,
        quorumMet: meeting.quorumMet,
        agendaUrl: meeting.agendaUrl,
        minutesUrl: meeting.minutesUrl,
        videoUrl: meeting.videoUrl,
        sourceDocUrl: meeting.sourceDocUrl,
      },
      summary: summaryMeta,
      items,
      contract: this.contract.status(),
      disclaimer:
        'Post-meeting outcomes from mirrored public records only. Not an official borough minutes substitute. DRAFT applications, MemberNotes, and unreviewed AI summary text are never included. Operated by Mitchel Turner Dev, LLC — not a borough property.',
      links: {
        json: `/api/board/meetings/${meetingId}/outcomes`,
        pdf: `/api/board/meetings/${meetingId}/outcomes.pdf`,
        packetPdf: `/api/board/meetings/${meetingId}/packet.pdf`,
        ui: `/official/meetings/${meetingId}/outcomes`,
        portal: '/official',
      },
    };
  }

  async buildPdf(meetingId: string): Promise<Buffer | null> {
    let data: ReturnType<MeetingOutcomesService['outcomes']>;
    try {
      data = this.outcomes(meetingId);
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      return null;
    }
    if (!data) return null;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 54, size: 'LETTER' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const when = new Date(data.meeting.scheduledAt).toLocaleString('en-US', {
        timeZone: 'America/Juneau',
        dateStyle: 'full',
        timeStyle: 'short',
      });

      doc.fontSize(18).fillColor('#000000').text('Creek Street Design Review — Meeting outcomes');
      doc.moveDown(0.25);
      doc.fontSize(9).fillColor('#444444').text(data.disclaimer, { width: 480 });
      doc.fillColor('#000000');
      doc.moveDown();

      doc.fontSize(12).text(`When: ${when} (Alaska)`);
      doc.text(`Location: ${data.meeting.location}`);
      doc.text(`Status: ${data.meeting.status}`);
      if (data.meeting.quorumMet === true) doc.text('Quorum: met');
      if (data.meeting.quorumMet === false) doc.text('Quorum: failed');
      if (data.summary) {
        doc.text(
          `Published summary on file: ${data.summary.id} (reviewed ${data.summary.reviewedAt ?? '—'}; body not printed here)`,
        );
      }
      doc.moveDown();

      doc.fontSize(13).text('Agenda outcomes');
      doc.moveDown(0.3);

      for (const item of data.items) {
        doc
          .fontSize(11)
          .fillColor('#000000')
          .text(`${item.agendaItem.itemNumber}. ${item.agendaItem.title}`);
        if (!item.application) {
          doc.fontSize(10).fillColor('#666666').text(`   ${item.note}`);
          doc.moveDown(0.4);
          continue;
        }
        doc
          .fontSize(10)
          .fillColor('#333333')
          .text(
            `   Case: ${item.application.caseNumber ?? item.application.id} · ${item.application.projectType.replace(/_/g, ' ')} · ${item.application.status}`,
          );
        doc.text(
          `   Site: ${item.structure?.commonName ?? item.structure?.addressLabel ?? '—'}`,
        );
        if (item.decision) {
          doc.text(`   Recommendation: ${item.decision.recommendation}`, { width: 480 });
          if (item.decision.conditions) {
            doc.text(`   Conditions: ${item.decision.conditions}`, { width: 480 });
          }
          doc.text(
            `   Vote: ${item.decision.voteFor ?? '—'}–${item.decision.voteAgainst ?? '—'} · Outcome: ${item.decision.finalOutcome ?? '—'}`,
          );
          if (item.decision.decidedAt) {
            doc.text(`   Decided: ${item.decision.decidedAt.slice(0, 10)}`);
          }
        } else {
          doc.text('   No mirrored decision row for this agenda item.');
        }
        doc.moveDown(0.45);
      }

      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .fillColor('#444444')
        .text('Verify against Clerk minutes before relying on this outcomes sheet.');
      if (data.meeting.minutesUrl) doc.text(`Minutes: ${data.meeting.minutesUrl}`);
      if (data.meeting.videoUrl) doc.text(`Video: ${data.meeting.videoUrl}`);

      doc.end();
    });
  }
}
