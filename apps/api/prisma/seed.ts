/**
 * Prisma seed — loads Phase 0 data when DATABASE_URL points at Postgres.
 * Default local/dev path uses the in-memory store (USE_MEMORY_STORE=true).
 */
import { PrismaClient } from '@prisma/client';
import {
  applications,
  criteria,
  decisions,
  districtBoundary,
  meetings,
  parcels,
  seats,
  structures,
} from '../src/data/phase0-seed';

const prisma = new PrismaClient();

async function main() {
  for (const c of criteria) {
    await prisma.criterion.upsert({
      where: { key: c.key as never },
      create: {
        key: c.key as never,
        label: c.label,
        plainLanguage: c.plainLanguage,
        codeCite: c.codeCite,
        codeText: c.codeText,
      },
      update: {
        label: c.label,
        plainLanguage: c.plainLanguage,
        codeCite: c.codeCite,
        codeText: c.codeText,
      },
    });
  }

  for (const p of parcels) {
    await prisma.parcel.upsert({
      where: { parcelNumber: p.parcelNumber },
      create: {
        id: p.id,
        parcelNumber: p.parcelNumber,
        address: p.address,
        geometry: p.geometry as object,
        inHdZone: p.inHdZone,
      },
      update: {
        address: p.address,
        geometry: p.geometry as object,
        inHdZone: p.inHdZone,
      },
    });
  }

  for (const s of structures) {
    await prisma.structure.upsert({
      where: { publicSlug: s.publicSlug },
      create: {
        id: s.id,
        parcelId: s.parcelId,
        commonName: s.commonName,
        addressLabel: s.addressLabel,
        yearBuilt: s.yearBuilt,
        nrhpContributing: s.nrhpContributing,
        historicNarrative: s.historicNarrative,
        publicSlug: s.publicSlug,
        centroid: s.centroid as object,
        sourceDocUrl: s.sourceDocUrl,
      },
      update: {
        commonName: s.commonName,
        addressLabel: s.addressLabel,
        yearBuilt: s.yearBuilt,
        nrhpContributing: s.nrhpContributing,
        historicNarrative: s.historicNarrative,
        centroid: s.centroid as object,
        sourceDocUrl: s.sourceDocUrl,
      },
    });
  }

  await prisma.districtFeature.deleteMany({ where: { kind: 'HD_BOUNDARY' } });
  await prisma.districtFeature.create({
    data: {
      kind: 'HD_BOUNDARY',
      name: 'Creek Street Historic District',
      geometry: districtBoundary.geometry as object,
      properties: districtBoundary.properties as object,
      sourceDocUrl: String(districtBoundary.properties?.sourceDocUrl ?? ''),
    },
  });

  for (const seat of seats) {
    await prisma.seat.upsert({
      where: { label: seat.label },
      create: {
        id: seat.id,
        label: seat.label,
        seatType: seat.seatType as never,
        terms: {
          create: seat.terms.map((t) => ({
            id: t.id,
            memberName: t.memberName,
            termStart: new Date(t.termStart),
            termEnd: new Date(t.termEnd),
            vacatedAt: t.vacatedAt ? new Date(t.vacatedAt) : null,
          })),
        },
      },
      update: { seatType: seat.seatType as never },
    });
  }

  for (const m of meetings) {
    await prisma.meeting.upsert({
      where: { id: m.id },
      create: {
        id: m.id,
        scheduledAt: new Date(m.scheduledAt),
        location: m.location,
        status: m.status as never,
        quorumMet: m.quorumMet,
        cancelReason: m.cancelReason,
        agendaUrl: m.agendaUrl,
        minutesUrl: m.minutesUrl,
        videoUrl: m.videoUrl,
        sourceDocUrl: m.sourceDocUrl,
        agendaItems: {
          create: m.agendaItems.map((ai) => ({
            id: ai.id,
            itemNumber: ai.itemNumber,
            title: ai.title,
            applicationId: null,
          })),
        },
      },
      update: {
        scheduledAt: new Date(m.scheduledAt),
        status: m.status as never,
        quorumMet: m.quorumMet,
      },
    });
  }

  for (const a of applications) {
    await prisma.application.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        caseNumber: a.caseNumber,
        parcelId: a.parcelId,
        structureId: a.structureId,
        applicantName: a.applicantName,
        projectType: a.projectType as never,
        description: a.description,
        status: a.status as never,
        filedAt: a.filedAt ? new Date(a.filedAt) : null,
        source: a.source as never,
        sourceDocUrl: a.sourceDocUrl,
      },
      update: {
        description: a.description,
        status: a.status as never,
        sourceDocUrl: a.sourceDocUrl,
      },
    });
  }

  // Link agenda items to applications after apps exist
  for (const m of meetings) {
    for (const ai of m.agendaItems) {
      if (!ai.applicationId) continue;
      await prisma.agendaItem.update({
        where: { id: ai.id },
        data: { applicationId: ai.applicationId },
      });
    }
  }

  for (const d of decisions) {
    await prisma.decision.upsert({
      where: { id: d.id },
      create: {
        id: d.id,
        applicationId: d.applicationId,
        meetingId: d.meetingId,
        recommendation: d.recommendation,
        conditions: d.conditions,
        voteFor: d.voteFor,
        voteAgainst: d.voteAgainst,
        finalOutcome: d.finalOutcome,
        sourceDocUrl: d.sourceDocUrl,
        decidedAt: d.decidedAt ? new Date(d.decidedAt) : null,
      },
      update: {
        recommendation: d.recommendation,
        finalOutcome: d.finalOutcome,
        sourceDocUrl: d.sourceDocUrl,
      },
    });
  }

  console.log('Phase 0 seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
