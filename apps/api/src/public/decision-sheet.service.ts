import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { applications, decisions, meetings, structures } from '../data/phase0-seed';
import { precedentExemplars } from '../data/phase1-seed';
import { PUBLIC_STATUS_SET } from '../store/public-statuses';

/**
 * Phase 28 — public decision sheet (teaching record).
 * Recommendation → vote/conditions → final action → case → meeting → visual precedents.
 * Never DRAFT apps, MemberNotes, or AI summary body.
 */
@Injectable()
export class DecisionSheetService {
  sheet(decisionId: string) {
    const decision = decisions.find((d) => d.id === decisionId);
    if (!decision) return null;

    const app = applications.find(
      (a) => a.id === decision.applicationId && PUBLIC_STATUS_SET.has(a.status),
    );
    if (!app) return null;

    const structure = structures.find((s) => s.id === app.structureId) ?? null;
    const meeting = decision.meetingId
      ? (meetings.find((m) => m.id === decision.meetingId) ?? null)
      : null;

    const exemplars = precedentExemplars
      .filter((e) => e.decisionId === decision.id)
      .map((e) => ({
        id: e.id,
        photoUrl: e.photoUrl,
        side: e.side,
        caption: e.caption,
        sourceDocUrl: e.sourceDocUrl,
        criterion: e.criterion,
        weight: e.weight,
      }));

    return {
      phase: 28,
      decision: {
        id: decision.id,
        recommendation: decision.recommendation,
        conditions: decision.conditions,
        voteFor: decision.voteFor,
        voteAgainst: decision.voteAgainst,
        finalOutcome: decision.finalOutcome,
        decidedAt: decision.decidedAt,
        sourceDocUrl: decision.sourceDocUrl,
        meetingId: decision.meetingId,
      },
      application: {
        id: app.id,
        caseNumber: app.caseNumber,
        projectType: app.projectType,
        description: app.description,
        status: app.status,
        filedAt: app.filedAt,
        caseBriefUi: `/docket/${app.id}`,
      },
      structure: structure
        ? {
            id: structure.id,
            commonName: structure.commonName,
            addressLabel: structure.addressLabel,
            publicSlug: structure.publicSlug,
            yearBuilt: structure.yearBuilt,
          }
        : null,
      meeting: meeting
        ? {
            id: meeting.id,
            scheduledAt: meeting.scheduledAt,
            location: meeting.location,
            status: meeting.status,
            agendaUi: `/meetings/${meeting.id}`,
            outcomesUi:
              meeting.status === 'HELD' ? `/meetings/${meeting.id}/outcomes` : null,
            summaryUi:
              meeting.status === 'HELD' ? `/meetings/${meeting.id}/summary` : null,
            packetPdf: `/api/meetings/${meeting.id}/packet.pdf`,
          }
        : null,
      precedents: exemplars,
      disclaimer:
        'Public decision sheet from mirrored records only. Illustrative precedent photos are placeholders until packet exhibits are mirrored. Not an official borough decision. DRAFT applications, MemberNotes, and unreviewed AI summary text are never included. Operated by Mitchel Turner Dev, LLC — not a borough property.',
      links: {
        json: `/api/decisions/${decision.id}`,
        pdf: `/api/decisions/${decision.id}/sheet.pdf`,
        ui: `/decisions/${decision.id}`,
        archive: '/decisions',
        precedents: '/precedents',
        caseBrief: `/docket/${app.id}`,
      },
    };
  }

  async buildPdf(decisionId: string): Promise<Buffer | null> {
    const data = this.sheet(decisionId);
    if (!data) return null;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 54, size: 'LETTER' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const label = data.application.caseNumber ?? data.application.id;

      doc.fontSize(18).fillColor('#000000').text('Creek Street Design Review — Decision sheet');
      doc.moveDown(0.25);
      doc.fontSize(9).fillColor('#444444').text(data.disclaimer, { width: 480 });
      doc.fillColor('#000000');
      doc.moveDown();

      doc.fontSize(13).text(label);
      doc
        .fontSize(10)
        .text(
          `${data.application.projectType.replace(/_/g, ' ')} · ${data.application.status}`,
        );
      if (data.decision.decidedAt) {
        doc.text(`Decided: ${data.decision.decidedAt.slice(0, 10)}`);
      }
      doc.moveDown();

      doc.fontSize(12).text('Recommendation');
      doc.fontSize(10).text(data.decision.recommendation, { width: 480 });
      if (data.decision.conditions) {
        doc.moveDown(0.3);
        doc.fontSize(12).text('Conditions');
        doc.fontSize(10).text(data.decision.conditions, { width: 480 });
      }
      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .text(
          `Vote ${data.decision.voteFor ?? '—'}–${data.decision.voteAgainst ?? '—'}`,
        );
      if (data.decision.finalOutcome) {
        doc.text(`Final action: ${data.decision.finalOutcome}`, { width: 480 });
      }
      doc.moveDown();

      doc.fontSize(12).text('Site');
      doc
        .fontSize(10)
        .text(
          data.structure
            ? `${data.structure.commonName ?? data.structure.addressLabel} (${data.structure.publicSlug})`
            : '—',
        );
      doc.text(`Case brief: ${data.application.caseBriefUi}`);
      doc.moveDown();

      if (data.meeting) {
        doc.fontSize(12).text('Meeting');
        const when = new Date(data.meeting.scheduledAt).toLocaleString('en-US', {
          timeZone: 'America/Juneau',
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        doc.fontSize(10).text(`${when} · ${data.meeting.status}`);
        doc.text(`Agenda: ${data.meeting.agendaUi}`);
        doc.moveDown();
      }

      doc.fontSize(12).text('Visual precedents');
      doc.moveDown(0.25);
      if (data.precedents.length === 0) {
        doc.fontSize(10).fillColor('#666666').text('No exemplars linked yet.');
      } else {
        for (const p of data.precedents) {
          doc
            .fontSize(10)
            .fillColor('#000000')
            .text(
              `• ${p.side.replace(/_/g, ' ')} · ${p.criterion.replace(/_/g, ' ')} (${p.weight.replace(/_/g, ' ')})`,
            );
          doc.text(`  ${p.caption}`, { width: 480 });
        }
      }

      doc.moveDown();
      doc
        .fontSize(9)
        .fillColor('#444444')
        .text(`Decision page: /decisions/${data.decision.id}`);
      doc.text('Verify against borough / Clerk records before relying on this sheet.');

      doc.end();
    });
  }
}
