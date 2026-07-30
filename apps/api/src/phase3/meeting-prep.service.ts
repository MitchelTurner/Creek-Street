import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { applications, decisions, meetings, structures } from '../data/phase0-seed';
import { Phase1Service } from '../phase1/phase1.service';
import { PUBLIC_STATUS_SET } from '../store/public-statuses';
import { BoardStore } from './board.store';
import { ContractGate } from './contract.gate';

/**
 * Phase 21 — board meeting prep brief from mirrored public facts.
 * Never includes DRAFT apps, other members' notes, or unreviewed AI summary bodies.
 */
@Injectable()
export class MeetingPrepService {
  constructor(
    private readonly phase1: Phase1Service,
    private readonly board: BoardStore,
    private readonly contract: ContractGate,
  ) {}

  prep(meetingId: string, userId: string) {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return null;

    const packet = {
      meetingId: meeting.id,
      scheduledAt: meeting.scheduledAt,
      status: meeting.status,
      location: meeting.location,
      itemCount: meeting.agendaItems.length,
    };
    const items = meeting.agendaItems.map((item) => {
      const app =
        item.applicationId != null
          ? applications.find(
              (a) => a.id === item.applicationId && PUBLIC_STATUS_SET.has(a.status),
            )
          : null;
      if (!app) {
        return {
          agendaItem: {
            id: item.id,
            itemNumber: item.itemNumber,
            title: item.title,
            applicationId: item.applicationId,
          },
          application: null,
          structure: null,
          similar: [] as Array<{
            applicationId: string;
            caseNumber: string | null;
            score: number;
            status: string;
          }>,
          privateNoteCount: 0,
          note: item.applicationId
            ? 'Linked application not on the public mirror (or still DRAFT).'
            : null,
        };
      }

      const structure = structures.find((s) => s.id === app.structureId) ?? null;
      const similarRaw = this.phase1.similarApplications(
        [
          app.description,
          ...decisions.filter((d) => d.applicationId === app.id).map((d) => d.recommendation),
        ].join(' '),
        4,
      );
      const similar = similarRaw.results
        .filter((r) => r.application.id !== app.id && PUBLIC_STATUS_SET.has(r.application.status))
        .slice(0, 3)
        .map((r) => ({
          applicationId: r.application.id,
          caseNumber: r.application.caseNumber,
          score: r.score,
          status: r.application.status,
        }));

      const privateNoteCount = this.board.listNotes(userId, app.id).length;

      return {
        agendaItem: {
          id: item.id,
          itemNumber: item.itemNumber,
          title: item.title,
          applicationId: item.applicationId,
        },
        application: {
          id: app.id,
          caseNumber: app.caseNumber,
          projectType: app.projectType,
          description: app.description,
          status: app.status,
          filedAt: app.filedAt,
        },
        structure: structure
          ? {
              id: structure.id,
              commonName: structure.commonName,
              addressLabel: structure.addressLabel,
              publicSlug: structure.publicSlug,
              nrhpContributing: structure.nrhpContributing,
            }
          : null,
        similar,
        privateNoteCount,
        note: null as string | null,
      };
    });

    return {
      phase: 21,
      meeting: {
        id: meeting.id,
        scheduledAt: meeting.scheduledAt,
        location: meeting.location,
        status: meeting.status,
        agendaUrl: meeting.agendaUrl,
        minutesUrl: meeting.minutesUrl,
      },
      packet: {
        ...packet,
        pdfPath: `/api/board/meetings/${meetingId}/packet.pdf`,
      },
      items,
      contract: this.contract.status(),
      disclaimer:
        'Personal meeting prep from mirrored public facts only. Not deliberation. Board discussion occurs only in a noticed public meeting (AS 44.62.310). MemberNotes stay author-scoped; DRAFT applications and unreviewed AI summaries are never included. Operated by Mitchel Turner Dev, LLC — not a borough property.',
      links: {
        json: `/api/board/meetings/${meetingId}/prep`,
        pdf: `/api/board/meetings/${meetingId}/prep.pdf`,
        packetPdf: `/api/board/meetings/${meetingId}/packet.pdf`,
        portal: '/official',
        ui: `/official/meetings/${meetingId}`,
      },
    };
  }

  async buildPdf(meetingId: string, userId: string): Promise<Buffer | null> {
    const data = this.prep(meetingId, userId);
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

      doc.fontSize(18).fillColor('#000000').text('Creek Street Design Review — Meeting prep');
      doc.moveDown(0.25);
      doc
        .fontSize(9)
        .fillColor('#444444')
        .text(data.disclaimer, { width: 480 });
      doc.fillColor('#000000');
      doc.moveDown();

      doc.fontSize(12).text(`When: ${when} (Alaska)`);
      doc.text(`Location: ${data.meeting.location}`);
      doc.text(`Status: ${data.meeting.status.replace(/_/g, ' ')}`);
      doc.moveDown();

      doc.fontSize(13).text('Agenda prep');
      doc.moveDown(0.3);

      for (const item of data.items) {
        doc
          .fontSize(11)
          .fillColor('#000000')
          .text(`${item.agendaItem.itemNumber}. ${item.agendaItem.title}`);
        if (!item.application) {
          doc
            .fontSize(10)
            .fillColor('#666666')
            .text(`   ${item.note ?? 'No public case linked.'}`);
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
        doc.text(`   ${item.application.description}`, { width: 480 });
        if (item.similar.length) {
          doc.text(
            `   Similar public cases: ${item.similar
              .map((s) => `${s.caseNumber ?? s.applicationId} (${s.score.toFixed(2)})`)
              .join('; ')}`,
          );
        } else {
          doc.text('   Similar public cases: (none scored)');
        }
        doc.text(`   Your private note count: ${item.privateNoteCount} (text not printed)`);
        doc.moveDown(0.45);
      }

      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .fillColor('#444444')
        .text(
          `Full mirrored packet: /api/board/meetings/${meetingId}/packet.pdf — Verify against Clerk agendas before relying on this prep sheet.`,
        );

      doc.end();
    });
  }
}
