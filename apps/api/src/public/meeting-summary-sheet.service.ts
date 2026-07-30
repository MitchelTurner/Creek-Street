import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { applications, meetings, structures } from '../data/phase0-seed';
import { Phase4Service } from '../phase4/phase4.service';
import { PUBLIC_STATUS_SET } from '../store/public-statuses';

/**
 * Phase 27 — public meeting summary sheet for human-reviewed, published AI summaries.
 * Unpublished / unreviewed drafts never appear (404). DRAFT apps omitted from per-item links.
 */
@Injectable()
export class MeetingSummarySheetService {
  constructor(private readonly phase4: Phase4Service) {}

  sheet(meetingId: string) {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return null;

    const published = this.phase4.publishedSummaryForMeeting(meetingId);
    if (!published) return null;

    const items = meeting.agendaItems.map((item) => {
      const per = published.perItem[item.id] ?? null;
      const app =
        item.applicationId != null
          ? applications.find(
              (a) => a.id === item.applicationId && PUBLIC_STATUS_SET.has(a.status),
            )
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
              status: app.status,
              caseBriefUi: `/docket/${app.id}`,
            }
          : null,
        structure: structure
          ? {
              commonName: structure.commonName,
              addressLabel: structure.addressLabel,
              publicSlug: structure.publicSlug,
            }
          : null,
        itemSummary: per
          ? {
              text: per.summary,
              sourceRefs: per.sourceRefs,
            }
          : null,
        note: app
          ? null
          : item.applicationId
            ? 'Linked application not on the public mirror (or still DRAFT).'
            : null,
      };
    });

    return {
      phase: 27,
      generatedByAi: true,
      humanReviewed: true,
      meeting: {
        id: meeting.id,
        scheduledAt: meeting.scheduledAt,
        location: meeting.location,
        status: meeting.status,
        quorumMet: meeting.quorumMet,
        agendaUrl: meeting.agendaUrl,
        minutesUrl: meeting.minutesUrl,
        videoUrl: meeting.videoUrl,
      },
      summary: {
        id: published.id,
        body: published.body,
        model: published.model,
        generatedAt: published.generatedAt,
        reviewedBy: published.reviewedBy,
        reviewedAt: published.reviewedAt,
        isPublished: published.isPublished,
      },
      items,
      disclaimer:
        'AI-generated meeting summary published after human review. Verify against Clerk minutes and video. Not an official borough record. DRAFT applications and MemberNotes are never included. Operated by Mitchel Turner Dev, LLC — not a borough property.',
      links: {
        json: `/api/meetings/${meetingId}/summary-sheet`,
        pdf: `/api/meetings/${meetingId}/summary-sheet.pdf`,
        softProbe: `/api/meetings/${meetingId}/summary`,
        agendaUi: `/meetings/${meetingId}`,
        outcomesUi: meeting.status === 'HELD' ? `/meetings/${meetingId}/outcomes` : null,
        packetPdf: `/api/meetings/${meetingId}/packet.pdf`,
        ui: `/meetings/${meetingId}/summary`,
        meetings: '/meetings',
      },
    };
  }

  async buildPdf(meetingId: string): Promise<Buffer | null> {
    const data = this.sheet(meetingId);
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

      doc.fontSize(18).fillColor('#000000').text('Creek Street Design Review — Meeting summary');
      doc.moveDown(0.25);
      doc.fontSize(9).fillColor('#444444').text(data.disclaimer, { width: 480 });
      doc.fillColor('#000000');
      doc.moveDown();

      doc.fontSize(12).text(`When: ${when} (Alaska)`);
      doc.text(`Location: ${data.meeting.location}`);
      doc.text(`Status: ${data.meeting.status}`);
      doc
        .fontSize(10)
        .text(
          `Reviewed by ${data.summary.reviewedBy ?? 'staff'} · ${data.summary.reviewedAt?.slice(0, 10) ?? '—'} · model ${data.summary.model}`,
        );
      doc.moveDown();

      doc.fontSize(13).text('Summary');
      doc.moveDown(0.25);
      doc.fontSize(10).text(data.summary.body, { width: 480 });
      doc.moveDown();

      doc.fontSize(13).text('Per agenda item');
      doc.moveDown(0.3);
      for (const item of data.items) {
        doc
          .fontSize(11)
          .fillColor('#000000')
          .text(`${item.agendaItem.itemNumber}. ${item.agendaItem.title}`);
        if (item.application) {
          doc
            .fontSize(10)
            .fillColor('#333333')
            .text(
              `   Case: ${item.application.caseNumber ?? item.application.id} · ${item.application.caseBriefUi}`,
            );
        } else if (item.note) {
          doc.fontSize(10).fillColor('#666666').text(`   ${item.note}`);
        }
        if (item.itemSummary) {
          doc.fontSize(10).fillColor('#000000').text(`   ${item.itemSummary.text}`, {
            width: 480,
          });
        } else {
          doc.fontSize(10).fillColor('#666666').text('   (no per-item summary)');
        }
        doc.moveDown(0.4);
      }

      doc.moveDown(0.3);
      doc
        .fontSize(9)
        .fillColor('#444444')
        .text('Generated by AI — verify against primary minutes/video.');
      doc.text(`Page: /meetings/${meetingId}/summary`);
      if (data.meeting.minutesUrl) doc.text(`Minutes: ${data.meeting.minutesUrl}`);
      if (data.meeting.videoUrl) doc.text(`Video: ${data.meeting.videoUrl}`);

      doc.end();
    });
  }
}
