import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  applications,
  decisions,
  meetings,
  parcels,
  structures,
} from '../data/phase0-seed';
import { precedentExemplars } from '../data/phase1-seed';
import { structurePhotos } from '../data/phase4-seed';
import { PUBLIC_STATUS_SET } from '../store/public-statuses';

/**
 * Phase 30 — structure civic dossier.
 * NRHP inventory → public cases → decisions → criteria → precedents → meetings.
 * Never DRAFT apps, MemberNotes, or AI summary body.
 */
@Injectable()
export class StructureSheetService {
  sheet(slug: string) {
    const structure = structures.find((s) => s.publicSlug === slug);
    if (!structure) return null;

    const parcel = parcels.find((p) => p.id === structure.parcelId) ?? null;
    const apps = applications.filter(
      (a) => a.structureId === structure.id && PUBLIC_STATUS_SET.has(a.status),
    );
    const appIds = new Set(apps.map((a) => a.id));
    const appDecisions = decisions.filter((d) => appIds.has(d.applicationId));
    const decisionIds = new Set(appDecisions.map((d) => d.id));

    const exemplars = precedentExemplars
      .filter((e) => decisionIds.has(e.decisionId))
      .map((e) => ({
        id: e.id,
        decisionId: e.decisionId,
        photoUrl: e.photoUrl,
        side: e.side,
        caption: e.caption,
        sourceDocUrl: e.sourceDocUrl,
        criterion: e.criterion,
        weight: e.weight,
        decisionUi: `/decisions/${e.decisionId}`,
        criterionUi: `/guidance/criteria/${e.criterion}`,
      }));

    const criterionKeys = [...new Set(exemplars.map((e) => e.criterion))].sort();

    const meetingIds = new Set<string>();
    for (const d of appDecisions) {
      if (d.meetingId) meetingIds.add(d.meetingId);
    }
    for (const m of meetings) {
      if (m.agendaItems.some((i) => i.applicationId && appIds.has(i.applicationId))) {
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
        agendaUi: `/meetings/${m.id}`,
        outcomesUi: m.status === 'HELD' ? `/meetings/${m.id}/outcomes` : null,
        summaryUi: m.status === 'HELD' ? `/meetings/${m.id}/summary` : null,
        packetPdf: `/api/meetings/${m.id}/packet.pdf`,
      }));

    const photos = structurePhotos
      .filter((p) => p.structureId === structure.id && p.moderationStatus === 'APPROVED')
      .sort((a, b) => (a.yearApprox ?? 0) - (b.yearApprox ?? 0))
      .map((p) => ({
        id: p.id,
        photoUrl: p.photoUrl,
        yearApprox: p.yearApprox,
        caption: p.caption,
        credit: p.credit,
        isHistoric: p.isHistoric,
      }));

    return {
      phase: 30,
      structure: {
        id: structure.id,
        publicSlug: structure.publicSlug,
        commonName: structure.commonName,
        addressLabel: structure.addressLabel,
        yearBuilt: structure.yearBuilt,
        nrhpContributing: structure.nrhpContributing,
        historicNarrative: structure.historicNarrative,
        sourceDocUrl: structure.sourceDocUrl,
      },
      parcel: parcel
        ? {
            id: parcel.id,
            parcelNumber: parcel.parcelNumber,
            address: parcel.address,
          }
        : null,
      photos,
      applications: apps.map((a) => ({
        id: a.id,
        caseNumber: a.caseNumber,
        projectType: a.projectType,
        description: a.description,
        status: a.status,
        filedAt: a.filedAt,
        caseBriefUi: `/docket/${a.id}`,
      })),
      decisions: appDecisions.map((d) => ({
        id: d.id,
        recommendation: d.recommendation,
        conditions: d.conditions,
        voteFor: d.voteFor,
        voteAgainst: d.voteAgainst,
        finalOutcome: d.finalOutcome,
        decidedAt: d.decidedAt,
        sourceDocUrl: d.sourceDocUrl,
        decisionUi: `/decisions/${d.id}`,
        meetingId: d.meetingId,
      })),
      criteria: criterionKeys.map((key) => ({
        key,
        ui: `/guidance/criteria/${key}`,
      })),
      precedents: exemplars,
      meetings: relatedMeetings,
      disclaimer:
        'Civic dossier from mirrored public records for this structure. Not an official borough property file. DRAFT applications, MemberNotes, and unreviewed AI summary text are never included. Operated by Mitchel Turner Dev, LLC — not a borough property.',
      links: {
        json: `/api/structures/${slug}/sheet`,
        pdf: `/api/structures/${slug}/sheet.pdf`,
        ui: `/structures/${slug}`,
        thin: `/api/structures/${slug}`,
        visit: `/visit/${slug}`,
        inventory: '/structures',
        map: '/map',
      },
    };
  }

  async buildPdf(slug: string): Promise<Buffer | null> {
    const data = this.sheet(slug);
    if (!data) return null;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 54, size: 'LETTER' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const title = data.structure.commonName ?? data.structure.addressLabel;

      doc.fontSize(18).fillColor('#000000').text('Creek Street Design Review — Structure dossier');
      doc.moveDown(0.25);
      doc.fontSize(9).fillColor('#444444').text(data.disclaimer, { width: 480 });
      doc.fillColor('#000000');
      doc.moveDown();

      doc.fontSize(14).text(title);
      if (data.structure.commonName) {
        doc.fontSize(10).text(data.structure.addressLabel);
      }
      doc
        .fontSize(10)
        .text(
          `Built ${data.structure.yearBuilt ?? '—'} · ${data.structure.nrhpContributing ? 'NRHP contributing' : 'Non-contributing'}`,
        );
      if (data.parcel) {
        doc.text(`Parcel ${data.parcel.parcelNumber} · ${data.parcel.address}`);
      }
      doc.moveDown(0.3);
      doc.fontSize(10).text(data.structure.historicNarrative, { width: 480 });
      doc.moveDown();

      doc.fontSize(12).text('Applications');
      doc.moveDown(0.2);
      if (data.applications.length === 0) {
        doc.fontSize(10).fillColor('#666666').text('None on the public mirror.');
        doc.fillColor('#000000');
      } else {
        for (const a of data.applications) {
          doc
            .fontSize(10)
            .fillColor('#000000')
            .text(
              `• ${a.caseNumber ?? a.id} · ${a.projectType.replace(/_/g, ' ')} · ${a.status} — ${a.caseBriefUi}`,
            );
        }
      }
      doc.moveDown();

      doc.fontSize(12).text('Decisions');
      doc.moveDown(0.2);
      if (data.decisions.length === 0) {
        doc.fontSize(10).fillColor('#666666').text('None mirrored yet.');
        doc.fillColor('#000000');
      } else {
        for (const d of data.decisions) {
          doc.fontSize(10).fillColor('#000000').text(`• ${d.decisionUi}`);
          doc.text(`  ${d.recommendation}`, { width: 480 });
          doc.text(
            `  Vote ${d.voteFor ?? '—'}–${d.voteAgainst ?? '—'} · ${d.finalOutcome ?? '—'}`,
          );
          doc.moveDown(0.3);
        }
      }

      if (data.criteria.length) {
        doc.moveDown(0.2);
        doc
          .fontSize(12)
          .fillColor('#000000')
          .text(`Criteria: ${data.criteria.map((c) => c.key.replace(/_/g, ' ')).join(', ')}`);
      }

      if (data.meetings.length) {
        doc.moveDown(0.4);
        doc.fontSize(12).text('Related meetings');
        for (const m of data.meetings) {
          const when = new Date(m.scheduledAt).toLocaleDateString('en-US', {
            timeZone: 'America/Juneau',
          });
          doc.fontSize(10).text(`• ${when} · ${m.status} — ${m.agendaUi}`);
        }
      }

      doc.moveDown();
      doc.fontSize(9).fillColor('#444444').text(`Page: /structures/${slug}`);
      doc.text('Verify against NRHP / borough records before relying on this dossier.');

      doc.end();
    });
  }
}
