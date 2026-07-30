import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { applications, criteria, meetings, structures } from '../data/phase0-seed';
import { PUBLIC_STATUS_SET } from '../store/public-statuses';

export type MeetingPacketMeta = {
  meetingId: string;
  scheduledAt: string;
  status: string;
  location: string;
  itemCount: number;
};

/**
 * Phase 13 — printable meeting packet from mirrored public facts only.
 * Never includes MemberNotes, DRAFT applications, or unreviewed AI summaries.
 */
@Injectable()
export class MeetingPacketService {
  meta(meetingId: string): MeetingPacketMeta | null {
    const m = meetings.find((x) => x.id === meetingId);
    if (!m) return null;
    return {
      meetingId: m.id,
      scheduledAt: m.scheduledAt,
      status: m.status,
      location: m.location,
      itemCount: m.agendaItems.length,
    };
  }

  async buildPdf(meetingId: string): Promise<Buffer | null> {
    const m = meetings.find((x) => x.id === meetingId);
    if (!m) return null;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 54, size: 'LETTER' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const when = new Date(m.scheduledAt).toLocaleString('en-US', {
        timeZone: 'America/Juneau',
        dateStyle: 'full',
        timeStyle: 'short',
      });

      doc.fontSize(18).fillColor('#000000').text('Creek Street Design Review — Meeting packet');
      doc.moveDown(0.25);
      doc
        .fontSize(9)
        .fillColor('#444444')
        .text(
          'PUBLIC MIRROR PACKET. Mirrored agenda facts only. Not an official borough packet. MemberNotes and applicant DRAFT materials are never included. Operated by Mitchel Turner Dev, LLC — not a borough property.',
        );
      doc.fillColor('#000000');
      doc.moveDown();

      doc.fontSize(12).text(`When: ${when} (Alaska)`);
      doc.text(`Status: ${m.status.replace(/_/g, ' ')}`);
      doc.text(`Location: ${m.location}`);
      if (m.quorumMet === false) doc.text('Quorum: failed (recorded)');
      if (m.quorumMet === true) doc.text('Quorum: met');
      doc.moveDown();

      doc.fontSize(13).text('Agenda');
      doc.moveDown(0.3);
      if (m.agendaItems.length === 0) {
        doc.fontSize(11).text('No agenda items mirrored yet.');
      }

      for (const item of m.agendaItems) {
        doc.fontSize(11).fillColor('#000000').text(`${item.itemNumber}. ${item.title}`);
        if (item.applicationId) {
          const app = applications.find(
            (a) => a.id === item.applicationId && PUBLIC_STATUS_SET.has(a.status),
          );
          if (app) {
            const structure = structures.find((s) => s.id === app.structureId);
            doc
              .fontSize(10)
              .fillColor('#333333')
              .text(
                `   Case: ${app.caseNumber ?? app.id} · ${app.projectType.replace(/_/g, ' ')} · ${app.status}`,
              );
            doc.text(
              `   Site: ${structure?.commonName ?? structure?.addressLabel ?? '—'}`,
            );
            doc.text(`   ${app.description}`, { width: 480 });
          } else {
            doc
              .fontSize(10)
              .fillColor('#666666')
              .text('   Linked application not on the public mirror (or still DRAFT).');
          }
        }
        doc.moveDown(0.45);
      }

      doc.moveDown(0.5);
      doc.fillColor('#000000').fontSize(13).text('Review criteria (reference)');
      doc.moveDown(0.25);
      for (const c of criteria) {
        doc.fontSize(10).text(`• ${c.label} (${c.codeCite})`);
        doc.fontSize(9).fillColor('#444444').text(`  ${c.plainLanguage}`, { width: 480 });
        doc.fillColor('#000000');
        doc.moveDown(0.25);
      }

      doc.moveDown();
      doc
        .fontSize(9)
        .fillColor('#444444')
        .text(
          'Verify against Clerk agendas/minutes before relying on this packet. Board deliberation occurs only in a noticed public meeting (AS 44.62.310).',
        );
      if (m.agendaUrl) doc.text(`Primary agenda: ${m.agendaUrl}`);
      if (m.minutesUrl) doc.text(`Minutes: ${m.minutesUrl}`);

      doc.end();
    });
  }
}
