import { describe, expect, it } from 'vitest';
import { Phase1Service } from '../phase1/phase1.service';
import { FilingPlanService } from './filing-plan.service';

describe('FilingPlanService', () => {
  const phase1 = new Phase1Service();

  const phase2 = {
    noticeLookup: async (opts: { address?: string }) => {
      if (!opts.address && !opts) {
        return { found: false, message: 'Parcel not found.', config: {} };
      }
      if (!opts.address?.toLowerCase().includes('creek')) {
        return { found: false, message: 'Parcel not found.', config: {} };
      }
      return {
        found: true,
        method: 'haversine-centroid',
        note: 'test notice',
        subjectParcel: {
          id: 'parcel_20',
          parcelNumber: 'TEST',
          address: '24 Creek Street',
        },
        radiusFeet: 600,
        radiusMeters: 183,
        config: {},
        noticedParcelSet: [{ id: 'parcel_20' }, { id: 'parcel_21' }],
        pendingApplicationsThatWouldNoticeAddress: [
          {
            application: {
              id: 'app_sample_pending',
              caseNumber: 'HD-PENDING',
              status: 'FILED',
            },
            parcel: { id: 'parcel_21' },
            meters: 40,
            within600ft: true,
            hdDistrictNotice: true,
          },
          {
            application: {
              id: 'app_sample_draft',
              caseNumber: 'DRAFT',
              status: 'DRAFT',
            },
            parcel: { id: 'x' },
            meters: 10,
            within600ft: true,
            hdDistrictNotice: true,
          },
        ],
      };
    },
  };

  const phase4 = {
    constructionWindow: (opts: {
      targetBuildMonth?: number;
      targetBuildYear?: number;
      projectType?: string;
    }) => ({
      target: {
        year: opts.targetBuildYear ?? 2026,
        month: opts.targetBuildMonth ?? 10,
        label: `${opts.targetBuildYear ?? 2026}-${String(opts.targetBuildMonth ?? 10).padStart(2, '0')}`,
      },
      inPeakCruiseSeason: false,
      recommendation: 'Shoulder season target.',
      shipCallsInMonth: { count: 0, estimatedPaxSum: 0, source: 'test', sample: [] },
      timeline: {
        medianDaysUsed: 45,
        usingPlanningAssumption: true,
        boardBufferDays: 21,
        disclaimer: 'test',
        projectType: opts.projectType ?? 'SIGNAGE',
      },
      fileByDate: '2026-07-26',
      fileByNote: 'Backward-planned filing date.',
      upcomingMeetingsAfterFileBy: [
        { id: 'mtg_2026_08', scheduledAt: '2026-08-15T18:00:00.000Z', status: 'SCHEDULED' },
      ],
      buildSeasonDefaults: {},
      pendingOnDocket: 1,
    }),
  };

  const svc = new FilingPlanService(phase1, phase2 as never, phase4 as never);

  it('assembles a signage filing pathway with structure and notice', async () => {
    const plan = await svc.plan({
      projectType: 'SIGNAGE',
      answers: { sign_start: 'yes', sign_new: 'change' },
      structureSlug: '20-creek-street',
      address: '24 Creek Street',
      buildMonth: 10,
      buildYear: 2026,
    });

    expect(plan).not.toBeNull();
    expect(plan!.phase).toBe(31);
    expect(plan!.triage.status).toBe('complete');
    expect(plan!.triage).toMatchObject({ outcome: 'REVIEW_REQUIRED' });
    expect(plan!.criteria.some((c) => c.key === 'MATERIAL_HONESTY')).toBe(true);
    expect(plan!.structure?.publicSlug).toBe('20-creek-street');
    expect(plan!.constructionWindow.fileByDate).toBe('2026-07-26');
    expect(plan!.steps.some((s) => s.key === 'zoning_administrator')).toBe(true);
    expect(plan!.links.ui).toContain('/filing?');
    expect(plan!.handoff.workspaceUi).toBe('/workspace');
    expect(JSON.stringify(plan)).not.toContain('app_sample_draft');
    expect(JSON.stringify(plan)).not.toContain('must never be public');
  });

  it('returns null for unknown project types', async () => {
    expect(await svc.plan({ projectType: 'NOT_A_TYPE' })).toBeNull();
  });

  it('keeps in-progress triage without inventing an outcome', async () => {
    const plan = await svc.plan({
      projectType: 'SIGNAGE',
      answers: { sign_start: 'yes' },
    });
    expect(plan!.triage.status).toBe('in_progress');
    expect(plan!.steps[0]?.key).toBe('triage');
    expect(plan!.steps[0]?.title).toMatch(/Finish triage/i);
  });

  it('builds a PDF buffer', async () => {
    const buf = await svc.buildPdf({
      projectType: 'SIGNAGE',
      answers: { sign_start: 'yes', sign_new: 'change' },
      structureSlug: '20-creek-street',
      address: '24 Creek Street',
      buildMonth: 10,
      buildYear: 2026,
    });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf!.length).toBeGreaterThan(200);
    expect(await svc.buildPdf({ projectType: 'NOT_A_TYPE' })).toBeNull();
  });
});
