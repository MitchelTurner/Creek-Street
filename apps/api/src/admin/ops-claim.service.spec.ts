import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { OpsClaimService } from './ops-claim.service';

describe('OpsClaimService', () => {
  function makeSvc() {
    return new OpsClaimService({
      snapshot: () => ({
        pendingPhotos: [{ id: 'photo_1' }],
        pendingSummaries: [{ id: 'sum_1', body: 'AI DRAFT SECRET' }],
        failedIngestRuns: [{ id: 'run_1' }],
      }),
    } as never);
  }

  const staffA = { id: 'a', email: 'a@example.com', role: 'STAFF' };
  const staffB = { id: 'b', email: 'b@example.com', role: 'STAFF' };
  const admin = { id: 'admin', email: 'admin@example.com', role: 'ADMIN' };

  it('claims an item and blocks a second staff claim until release', () => {
    const svc = makeSvc();
    const now = Date.parse('2026-07-30T12:00:00.000Z');
    const claim = svc.claim('photo', 'photo_1', staffA, now);
    expect(claim?.email).toBe('a@example.com');
    expect(claim?.expiresAt).toBe('2026-07-30T14:00:00.000Z');

    expect(() => svc.claim('photo', 'photo_1', staffB, now)).toThrow(ConflictException);

    const enriched = svc.enrichQueueItems('photo', [{ id: 'photo_1', caption: 'x' }], now);
    expect(enriched[0]?.claim?.email).toBe('a@example.com');

    expect(() => svc.release('photo', 'photo_1', staffB, { nowMs: now })).toThrow(
      ConflictException,
    );
    expect(svc.release('photo', 'photo_1', staffA, { nowMs: now }).released).toBe(true);
    const again = svc.claim('photo', 'photo_1', staffB, now);
    expect(again?.email).toBe('b@example.com');
  });

  it('allows ADMIN force-release and expires claims', () => {
    const svc = makeSvc();
    const now = Date.parse('2026-07-30T12:00:00.000Z');
    svc.claim('summary', 'sum_1', staffA, now);
    expect(svc.release('summary', 'sum_1', admin, { force: true, nowMs: now }).released).toBe(
      true,
    );

    svc.claim('ingest', 'run_1', staffA, now);
    const expired = svc.get('ingest', 'run_1', now + 3 * 3600000);
    expect(expired).toBeNull();
  });

  it('404s unknown queue ids', () => {
    const svc = makeSvc();
    expect(() => svc.claim('photo', 'missing', staffA)).toThrow(NotFoundException);
  });
});
