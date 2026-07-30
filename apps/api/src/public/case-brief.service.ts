import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  applications,
  decisions,
  meetings,
  parcels,
  structures,
} from '../data/phase0-seed';
import { PUBLIC_STATUS_SET } from '../store/public-statuses';

/**
 * Phase 24 — public case brief for a mirrored application.
 * Ties docket → structure → decisions → held-meeting outcomes links.
 * Never DRAFT, MemberNotes, or AI summary body.
 */
@Injectable()
export class CaseBriefService {
  brief(applicationId: string) {
    const app = applications.find(
      (a) => a.id === applicationId && PUBLIC_STATUS_SET.has(a.status),
    );
    if (!app) return null;

    const structure = structures.find((s) => s.id === app.structureId) ?? null;
    const parcel = parcels.find((p) => p.id === app.parcelId) ?? null;
    const appDecisions = decisions.filter((d) => d.applicationId === app.id);

    const meetingIds = new Set<string>();
    for (const d of appDecisions) {
      if (d.meetingId) meetingIds.add(d.meetingId);
    }
    for (const m of meetings) {
      if (m.agendaItems.some((i) => i.applicationId === app.id)) {
        meetingIds.add(m.id);
      }
    }

    const relatedMeetings = [...meetingIds]
      .map((id) => meetings.find((m) => m.id === id))
      .filter((m): m is (typeof meetings)[number] => Boolean(m))
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
      .map((m) => ({
        id: m.id,
        scheduledAt: m.scheduledAt,
        location: m.location,
        status: m.status,
        quorumMet: m.quorumMet,
        agendaUrl: m.agendaUrl,
        minutesUrl: m.minutesUrl,
        videoUrl: m.videoUrl,
        agendaUi: `/meetings/${m.id}`,
        outcomes:
          m.status === 'HELD'
            ? {
                json: `/api/meetings/${m.id}/outcomes`,
                pdf: `/api/meetings/${m.id}/outcomes.pdf`,
                ui: `/meetings/${m.id}/outcomes`,
              }
            : null,
        packetPdf: `/api/meetings/${m.id}/packet.pdf`,
      }));

    return {
      phase: 24,
      application: {
        id: app.id,
        caseNumber: app.caseNumber,
        projectType: app.projectType,
        description: app.description,
        status: app.status,
        filedAt: app.filedAt,
        applicantName: app.applicantName,
        source: app.source,
        sourceDocUrl: app.sourceDocUrl,
      },
      structure: structure
        ? {
            id: structure.id,
            commonName: structure.commonName,
            addressLabel: structure.addressLabel,
            publicSlug: structure.publicSlug,
            yearBuilt: structure.yearBuilt,
            nrhpContributing: structure.nrhpContributing,
          }
        : null,
      parcel: parcel
        ? {
            id: parcel.id,
            parcelNumber: parcel.parcelNumber,
            address: parcel.address,
          }
        : null,
      decisions: appDecisions.map((d) => ({
        id: d.id,
        meetingId: d.meetingId,
        recommendation: d.recommendation,
        conditions: d.conditions,
        voteFor: d.voteFor,
        voteAgainst: d.voteAgainst,
        finalOutcome: d.finalOutcome,
        decidedAt: d.decidedAt,
        sourceDocUrl: d.sourceDocUrl,
      })),
      meetings: relatedMeetings,
      disclaimer:
        'Public case brief from mirrored records only. Not an official borough case file. DRAFT applications, MemberNotes, and unreviewed AI summary text are never included. Operated by Mitchel Turner Dev, LLC — not a borough property.',
      links: {
        json: `/api/applications/${app.id}/brief`,
        pdf: `/api/applications/${app.id}/brief.pdf`,
        ui: `/docket/${app.id}`,
        docket: '/docket',
        decisions: '/decisions',
      },
    };
  }

  async buildPdf(applicationId: string): Promise<Buffer | null> {
    const data = this.brief(applicationId);
    if (!data) return null;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 54, size: 'LETTER' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const label = data.application.caseNumber ?? data.application.id;

      doc.fontSize(18).fillColor('#000000').text('Creek Street Design Review — Case brief');
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
      if (data.application.filedAt) {
        doc.text(`Filed: ${data.application.filedAt.slice(0, 10)}`);
      }
      doc.moveDown(0.3);
      doc.text(data.application.description, { width: 480 });
      doc.moveDown();

      doc.fontSize(12).text('Site');
      doc
        .fontSize(10)
        .text(
          data.structure
            ? `${data.structure.commonName ?? data.structure.addressLabel} (${data.structure.publicSlug})`
            : '—',
        );
      if (data.parcel) {
        doc.text(`Parcel ${data.parcel.parcelNumber} · ${data.parcel.address}`);
      }
      doc.moveDown();

      doc.fontSize(12).text('Decisions');
      doc.moveDown(0.25);
      if (data.decisions.length === 0) {
        doc.fontSize(10).fillColor('#666666').text('No mirrored decision yet.');
        doc.fillColor('#000000');
      } else {
        for (const d of data.decisions) {
          doc
            .fontSize(10)
            .fillColor('#000000')
            .text(d.recommendation, { width: 480 });
          if (d.conditions) doc.text(`Conditions: ${d.conditions}`, { width: 480 });
          doc.text(
            `Vote ${d.voteFor ?? '—'}–${d.voteAgainst ?? '—'} · ${d.finalOutcome ?? '—'}`,
          );
          if (d.decidedAt) doc.text(`Decided: ${d.decidedAt.slice(0, 10)}`);
          doc.moveDown(0.4);
        }
      }

      doc.moveDown(0.3);
      doc.fontSize(12).fillColor('#000000').text('Related meetings');
      doc.moveDown(0.25);
      if (data.meetings.length === 0) {
        doc.fontSize(10).fillColor('#666666').text('No related mirrored meetings.');
      } else {
        for (const m of data.meetings) {
          const when = new Date(m.scheduledAt).toLocaleString('en-US', {
            timeZone: 'America/Juneau',
            dateStyle: 'medium',
            timeStyle: 'short',
          });
          doc
            .fontSize(10)
            .fillColor('#000000')
            .text(`${when} · ${m.status}${m.outcomes ? ' · outcomes available' : ''}`);
        }
      }

      doc.moveDown();
      doc
        .fontSize(9)
        .fillColor('#444444')
        .text(`Case page: /docket/${data.application.id}`);
      doc.text('Verify against borough / Clerk records before relying on this brief.');

      doc.end();
    });
  }
}
