import { BadRequestException, Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Phase2Service } from '../phase2/phase2.service';

/**
 * Phase 32 — printable neighbor notice helper from public notice lookup facts.
 * Never invents DRAFT applications; cites KGBC notice rules from Phase2 config.
 */
@Injectable()
export class NoticePacketService {
  constructor(private readonly phase2: Phase2Service) {}

  async buildPdf(address: string): Promise<Buffer> {
    const q = address?.trim();
    if (!q || q.length < 3) {
      throw new BadRequestException('address query param required (min 3 chars)');
    }
    const notice = await this.phase2.noticeLookup({ address: q });
    if (!notice.found || !notice.subjectParcel || !notice.noticedParcelSet) {
      throw new BadRequestException(
        ('message' in notice && notice.message) ||
          'Parcel not found. Try an HD zone address (e.g. "24 Creek Street").',
      );
    }

    const subject = notice.subjectParcel;
    const neighbors = notice.noticedParcelSet
      .filter((p) => p.id !== subject.id)
      .slice(0, 80);
    const pending = (notice.pendingApplicationsThatWouldNoticeAddress ?? [])
      .filter(
        (row): row is NonNullable<typeof row> =>
          Boolean(
            row &&
              row.within600ft &&
              row.application.status !== 'DRAFT' &&
              !String(row.application.id).includes('draft'),
          ),
      )
      .slice(0, 40);

    const suggestedLanguage = [
      `Neighbor notice — Creek Street Historic District (public mirror helper)`,
      ``,
      `Subject property: ${subject.address} (parcel ${subject.parcelNumber}).`,
      `Notice radius applied: ${notice.radiusFeet} feet (city-style radius under KGBC 18.90.060, as mirrored).`,
      `HD district-wide notice may also apply under KGBC 18.90.020 when both parcels are in the HD zone.`,
      ``,
      `This letter is a draft checklist for applicants preparing statutory notice. It is not an official Borough form and is not legal advice. Confirm wording, mailing lists, and deadlines with Historic District / Zoning staff before sending.`,
      ``,
      `You are receiving this because your parcel is within the mirrored notice set for the subject property above. A design-review application affecting exterior appearance in the Creek Street Historic District may be scheduled for the Architectural Design Review Board. Please consult the public docket and primary Borough agenda materials for hearing dates.`,
    ].join('\n');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 48, size: 'LETTER' });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text('Creek Street — Neighbor notice packet', { underline: true });
      doc.moveDown(0.4);
      doc
        .fontSize(9)
        .fillColor('#444')
        .text(`Generated ${new Date().toISOString().slice(0, 10)} · Public mirror · not a Borough form`);
      doc.fillColor('#000');
      doc.moveDown();
      doc.fontSize(11).text(`Subject address: ${subject.address}`);
      doc.text(`Parcel: ${subject.parcelNumber}`);
      doc.text(`Method: ${notice.method}`);
      doc.moveDown();
      doc.fontSize(12).text('Notice radius', { underline: true });
      doc.fontSize(10).text(`${notice.radiusFeet} feet · ${notice.note}`);
      if (notice.config?.hdDesignReview) {
        doc.moveDown(0.3);
        doc
          .fontSize(9)
          .text(`${notice.config.hdDesignReview.cite} — ${notice.config.hdDesignReview.rule}`);
      }
      if (notice.config?.planningCommissionStyle) {
        doc
          .fontSize(9)
          .text(
            `${notice.config.planningCommissionStyle.cite} — ${notice.config.planningCommissionStyle.rule}`,
          );
      }
      doc.moveDown();
      doc.fontSize(12).text(`Neighbor parcels in radius (${neighbors.length})`, { underline: true });
      doc.moveDown(0.3);
      if (!neighbors.length) {
        doc.fontSize(10).text('No neighbor parcels found in the current parcel dataset for this radius.');
      } else {
        for (const n of neighbors) {
          const feet =
            typeof n.meters === 'number' ? ` · ~${Math.round(n.meters * 3.28084)} ft` : '';
          doc
            .fontSize(10)
            .text(`• ${n.address || '(no address)'} · ${n.parcelNumber || n.id}${feet}`);
        }
      }
      doc.moveDown();
      doc.fontSize(12).text('Pending applications that would notice this address', {
        underline: true,
      });
      doc.moveDown(0.3);
      if (!pending.length) {
        doc.fontSize(10).text('None in the current public mirror.');
      } else {
        for (const row of pending) {
          doc
            .fontSize(10)
            .text(
              `• ${row.application.caseNumber ?? row.application.id} · ${row.application.status} · ${row.parcel.address}${row.hdDistrictNotice ? ' · HD district notice' : ''}`,
            );
        }
      }
      doc.moveDown();
      doc.fontSize(12).text('Suggested notice language (draft for applicant use)', {
        underline: true,
      });
      doc.moveDown(0.3);
      doc.fontSize(9).text(suggestedLanguage, { align: 'left' });
      doc.moveDown();
      doc
        .fontSize(8)
        .fillColor('#666')
        .text(
          'Not legal advice. Confirm notice requirements with Historic District staff before mailing. Operated by Mitchel Turner Dev, LLC — not a borough property.',
        );
      doc.end();
    });
  }
}
