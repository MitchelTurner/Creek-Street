import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { applications, decisions, meetings, structures } from '../data/phase0-seed';
import { meetingSummaries } from '../data/phase4-seed';
import { PUBLIC_STATUS_SET } from '../store/public-statuses';

/**
 * Phase 26 — public meeting agenda brief (zero-auth).
 * Agenda → public case → structure → case brief links; outcomes when HELD.
 * Never DRAFT apps, MemberNotes, or AI summary body.
 */
@Injectable()
export class MeetingAgendaService {
  agenda(meetingId: string) {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return null;

    const published = meetingSummaries.find(
      (s) => s.meetingId === meetingId && s.isPublished && s.reviewedAt,
    );
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
      const structure = app
        ? (structures.find((s) => s.id === app.structureId) ?? null)
        : null;
      const decision = app
        ? (decisions.find((d) => d.applicationId === app.id && d.meetingId === meetingId) ??
          decisions.find((d) => d.applicationId === app.id) ??
          null)
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
              filedAt: app.filedAt,
              caseBriefUi: `/docket/${app.id}`,
              caseBriefJson: `/api/applications/${app.id}/brief`,
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
      phase: 26,
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
      outcomes:
        meeting.status === 'HELD'
          ? {
              json: `/api/meetings/${meetingId}/outcomes`,
              pdf: `/api/meetings/${meetingId}/outcomes.pdf`,
              ui: `/meetings/${meetingId}/outcomes`,
            }
          : null,
      disclaimer:
        'Public meeting agenda from mirrored records only. Not an official borough agenda substitute. DRAFT applications, MemberNotes, and unreviewed AI summary text are never included. Operated by Mitchel Turner Dev, LLC — not a borough property.',
      links: {
        json: `/api/meetings/${meetingId}/agenda`,
        pdf: `/api/meetings/${meetingId}/agenda.pdf`,
        packetPdf: `/api/meetings/${meetingId}/packet.pdf`,
        ui: `/meetings/${meetingId}`,
        meetings: '/meetings',
      },
    };
  }

  async buildPdf(meetingId: string): Promise<Buffer | null> {
    const data = this.agenda(meetingId);
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

      doc.fontSize(18).fillColor('#000000').text('Creek Street Design Review — Meeting agenda');
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
      if (data.outcomes) {
        doc.text(`Outcomes available: ${data.outcomes.ui}`);
      }
      doc.moveDown();

      doc.fontSize(13).text('Agenda');
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
        doc.text(`   Case brief: ${item.application.caseBriefUi}`);
        if (item.decision) {
          doc.text(
            `   Mirrored decision: vote ${item.decision.voteFor ?? '—'}–${item.decision.voteAgainst ?? '—'} · ${item.decision.finalOutcome ?? '—'}`,
            { width: 480 },
          );
        }
        doc.moveDown(0.45);
      }

      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .fillColor('#444444')
        .text('Verify against Clerk agendas before relying on this agenda sheet.');
      if (data.meeting.agendaUrl) doc.text(`Agenda: ${data.meeting.agendaUrl}`);
      doc.text(`Packet: /api/meetings/${meetingId}/packet.pdf`);

      doc.end();
    });
  }
}
