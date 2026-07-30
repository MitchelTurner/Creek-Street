import { describe, expect, it } from 'vitest';
import { MemoryStore } from './memory.store';
import { PublicStore } from './public.store';
import { PUBLIC_STATUS_SET } from './public-statuses';

function memoryPrisma() {
  return {
    enabled: false,
  } as never;
}

describe('PublicStore', () => {
  it('defaults to memory backend and never returns DRAFT apps', async () => {
    const store = new PublicStore(new MemoryStore(), memoryPrisma());
    expect(store.backend()).toBe('memory');
    const apps = await store.listApplications();
    expect(apps.every((a) => PUBLIC_STATUS_SET.has(a.status))).toBe(true);
    expect(await store.listApplications({ status: 'DRAFT' })).toEqual([]);
  });

  it('falls back to memory when prisma path throws', async () => {
    const prisma = {
      enabled: true,
      application: {
        findMany: async () => {
          throw new Error('db down');
        },
      },
    } as never;
    const store = new PublicStore(new MemoryStore(), prisma);
    const apps = await store.listApplications();
    expect(apps.length).toBeGreaterThan(0);
    expect(apps.every((a) => a.status !== 'DRAFT')).toBe(true);
  });

  it('filters prisma rows that somehow include DRAFT', async () => {
    const prisma = {
      enabled: true,
      application: {
        findMany: async () => [
          {
            id: 'drafty',
            caseNumber: null,
            parcelId: 'p',
            structureId: null,
            applicantName: null,
            projectType: 'SIGNAGE',
            description: 'secret',
            status: 'DRAFT',
            filedAt: null,
            source: 'APPLICANT_DRAFT',
            sourceDocUrl: null,
            structure: null,
            parcel: null,
            decisions: [],
          },
          {
            id: 'public1',
            caseNumber: 'HDR-1',
            parcelId: 'p',
            structureId: null,
            applicantName: 'A',
            projectType: 'SIGNAGE',
            description: 'ok',
            status: 'APPROVED',
            filedAt: new Date('2024-01-01'),
            source: 'MIRRORED',
            sourceDocUrl: null,
            structure: null,
            parcel: null,
            decisions: [],
          },
        ],
      },
    } as never;
    const store = new PublicStore(new MemoryStore(), prisma);
    const apps = await store.listApplications();
    expect(apps.map((a) => a.id)).toEqual(['public1']);
  });
});
