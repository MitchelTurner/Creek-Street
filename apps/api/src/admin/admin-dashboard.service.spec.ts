import { describe, expect, it } from 'vitest';
import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  it('assembles a staff snapshot with phase 15 and required sections', async () => {
    const svc = new AdminDashboardService(
      {
        check: async () => ({ ready: true, phase: 15, checks: { api: true } }),
      } as never,
      {
        status: async () => ({
          noticeMethod: 'centroid-haversine-approx',
          postgis: false,
          pgvector: false,
          prismaEnabled: false,
        }),
      } as never,
      { status: () => ({ mode: 'stub', sent: 0, failed: 0, from: 'x' }) } as never,
      {
        lastDigest: () => null,
        lastOutcomesDigest: () => null,
        lastCaseDigest: () => null,
      } as never,
      { list: () => [] } as never,
      {
        readinessChecklist: () => ({
          score: { done: 5, total: 10 },
          deliberationUnlocked: false,
          items: [{ id: 'x', label: 'Open', done: false, detail: 'todo' }],
          message: 'dark',
        }),
      } as never,
      { status: () => ({ mode: 'inline', redisConfigured: false, queue: 'creek-ingest' }) } as never,
      {
        listSources: () => [],
        listRuns: () => [],
      } as never,
      { lastBrief: () => null } as never,
      {
        snapshot: () => ({
          thresholds: {
            photoHours: 48,
            summaryHours: 24,
            ingestHours: 12,
            alertCooldownHours: 6,
          },
          counts: {
            staleTotal: 2,
            stalePhotos: 1,
            staleSummaries: 1,
            staleIngestRuns: 0,
          },
          lastAlert: null,
        }),
      } as never,
      {
        status: () => ({
          phase: 19,
          enabled: false,
          tickHours: 1,
          running: false,
          lastTick: null,
          nextTickAt: null,
        }),
      } as never,
      {
        summary: () => ({
          claimHours: 2,
          activeCount: 1,
          byKind: { photo: 1, summary: 0, ingest: 0 },
        }),
      } as never,
    );

    const snap = await svc.snapshot();
    expect(snap.phase).toBe(15);
    expect(snap.ready.ready).toBe(true);
    expect(snap.compliance.openItems).toHaveLength(1);
    expect(snap.links.ingest).toBe('/admin/ingest');
    expect(snap.links.queue).toBe('/admin/queue');
    expect(snap.links.briefPreview).toBe('/api/ops/brief/preview');
    expect(snap.links.alertPreview).toBe('/api/ops/alerts/preview');
    expect(snap.links.scheduler).toBe('/api/ops/scheduler');
    expect(snap.mail.mode).toBe('stub');
    expect(snap.opsBrief).toBeNull();
    expect(snap.aging.staleTotal).toBe(2);
    expect(snap.scheduler.enabled).toBe(false);
    expect(snap.claims.activeCount).toBe(1);
  });
});
