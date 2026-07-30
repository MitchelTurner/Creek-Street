import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { applications, criteria, decisions, structures } from '../data/phase0-seed';
import { precedentExemplars } from '../data/phase1-seed';
import { PUBLIC_STATUS_SET } from '../store/public-statuses';

/**
 * Phase 29 — criterion teaching atlas.
 * Plain-language criterion + linked public decisions + visual precedents.
 * Never DRAFT apps, MemberNotes, or AI summary body.
 */
@Injectable()
export class CriterionAtlasService {
  list() {
    return {
      phase: 29,
      criteria: criteria.map((c) => ({
        key: c.key,
        label: c.label,
        codeCite: c.codeCite,
        href: `/guidance/criteria/${c.key}`,
        api: `/api/guidance/criteria/${c.key}`,
      })),
      note: 'Teaching pages for KGBC 18.40.010(13) review criteria. Not legal conclusions.',
    };
  }

  atlas(key: string) {
    const criterion = criteria.find((c) => c.key === key);
    if (!criterion) return null;

    const exemplars = precedentExemplars
      .filter((e) => e.criterion === key)
      .map((e) => ({
        id: e.id,
        decisionId: e.decisionId,
        photoUrl: e.photoUrl,
        side: e.side,
        caption: e.caption,
        sourceDocUrl: e.sourceDocUrl,
        weight: e.weight,
        decisionUi: `/decisions/${e.decisionId}`,
      }));

    const decisionIds = [...new Set(exemplars.map((e) => e.decisionId))];
    const linkedDecisions = decisionIds
      .map((id) => {
        const decision = decisions.find((d) => d.id === id);
        if (!decision) return null;
        const app = applications.find(
          (a) => a.id === decision.applicationId && PUBLIC_STATUS_SET.has(a.status),
        );
        if (!app) return null;
        const structure = structures.find((s) => s.id === app.structureId) ?? null;
        return {
          id: decision.id,
          recommendation: decision.recommendation,
          conditions: decision.conditions,
          voteFor: decision.voteFor,
          voteAgainst: decision.voteAgainst,
          finalOutcome: decision.finalOutcome,
          decidedAt: decision.decidedAt,
          decisionUi: `/decisions/${decision.id}`,
          application: {
            id: app.id,
            caseNumber: app.caseNumber,
            projectType: app.projectType,
            status: app.status,
            caseBriefUi: `/docket/${app.id}`,
          },
          structure: structure
            ? {
                commonName: structure.commonName,
                addressLabel: structure.addressLabel,
                publicSlug: structure.publicSlug,
              }
            : null,
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));

    return {
      phase: 29,
      criterion: {
        key: criterion.key,
        label: criterion.label,
        plainLanguage: criterion.plainLanguage,
        codeCite: criterion.codeCite,
        codeText: criterion.codeText,
      },
      decisions: linkedDecisions,
      precedents: exemplars,
      disclaimer:
        'Teaching atlas for a single review criterion from mirrored public records. Exemplar photos are illustrative placeholders. Not a legal conclusion — the Zoning Administrator decides applicability. DRAFT applications, MemberNotes, and unreviewed AI summary text are never included. Operated by Mitchel Turner Dev, LLC — not a borough property.',
      links: {
        json: `/api/guidance/criteria/${key}`,
        pdf: `/api/guidance/criteria/${key}/sheet.pdf`,
        ui: `/guidance/criteria/${key}`,
        guidance: '/guidance',
        precedents: `/precedents`,
        index: '/api/guidance/criteria',
      },
    };
  }

  async buildPdf(key: string): Promise<Buffer | null> {
    const data = this.atlas(key);
    if (!data) return null;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 54, size: 'LETTER' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).fillColor('#000000').text('Creek Street Design Review — Criterion atlas');
      doc.moveDown(0.25);
      doc.fontSize(9).fillColor('#444444').text(data.disclaimer, { width: 480 });
      doc.fillColor('#000000');
      doc.moveDown();

      doc.fontSize(14).text(data.criterion.label);
      doc.fontSize(10).text(data.criterion.codeCite);
      doc.moveDown(0.3);
      doc.fontSize(10).text(data.criterion.plainLanguage, { width: 480 });
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor('#555555').text(data.criterion.codeText, { width: 480 });
      doc.fillColor('#000000');
      doc.moveDown();

      doc.fontSize(12).text('Linked decisions');
      doc.moveDown(0.25);
      if (data.decisions.length === 0) {
        doc.fontSize(10).fillColor('#666666').text('No mirrored decisions tagged to this criterion yet.');
        doc.fillColor('#000000');
      } else {
        for (const d of data.decisions) {
          doc
            .fontSize(10)
            .fillColor('#000000')
            .text(
              `• ${d.application.caseNumber ?? d.application.id} — ${d.decisionUi}`,
            );
          doc.text(`  ${d.recommendation}`, { width: 480 });
          doc.text(
            `  Vote ${d.voteFor ?? '—'}–${d.voteAgainst ?? '—'} · ${d.finalOutcome ?? '—'}`,
          );
          doc.moveDown(0.35);
        }
      }

      doc.moveDown(0.2);
      doc.fontSize(12).fillColor('#000000').text('Visual precedents');
      doc.moveDown(0.25);
      if (data.precedents.length === 0) {
        doc.fontSize(10).fillColor('#666666').text('No exemplars for this criterion yet.');
      } else {
        for (const p of data.precedents) {
          doc
            .fontSize(10)
            .fillColor('#000000')
            .text(
              `• ${p.side.replace(/_/g, ' ')} (${p.weight.replace(/_/g, ' ')}) — ${p.decisionUi}`,
            );
          doc.text(`  ${p.caption}`, { width: 480 });
          doc.moveDown(0.3);
        }
      }

      doc.moveDown();
      doc
        .fontSize(9)
        .fillColor('#444444')
        .text(`Page: /guidance/criteria/${key}`);
      doc.text('Verify against current KGBC Title 18 before relying on this sheet.');

      doc.end();
    });
  }
}
