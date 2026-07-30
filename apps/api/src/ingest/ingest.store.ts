import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import type { IngestRun, IngestSourceId, SourceWatermark } from './ingest.types';

const SOURCE_META: Record<IngestSourceId, { label: string; notes: string }> = {
  clerk_agendas: {
    label: 'Clerk agendas / minutes / packets',
    notes:
      'Prefer Clerk-provided feed or kgbak.us CivicPlus RSS/iCal. Do not scrape borough.ketchikan.ak.us against robots.txt.',
  },
  borough_gis: {
    label: 'Borough GIS / parcels',
    notes: 'Prefer ArcGIS REST endpoint before any scrape. Geometry powers notice radius ST_DWithin.',
  },
  nrhp_seed: {
    label: 'NRHP nomination refresh',
    notes: 'Federal public domain (14000454). One-time seed; rare refresh.',
  },
  ktnport_ships: {
    label: 'ktnport ship calls',
    notes: 'Internal API between own properties — do not duplicate the scraper.',
  },
  embedding_refresh: {
    label: 'Precedent embedding refresh',
    notes: 'BullMQ off request path. Writes embeddings for similarity search; never on hot path.',
  },
  meeting_summaries: {
    label: 'Meeting summary generation',
    notes: 'AI draft only. isPublished stays false until human review.',
  },
};

@Injectable()
export class IngestStore {
  private watermarks = new Map<IngestSourceId, SourceWatermark>();
  private runs: IngestRun[] = [];

  constructor() {
    for (const sourceId of Object.keys(SOURCE_META) as IngestSourceId[]) {
      this.watermarks.set(sourceId, {
        sourceId,
        lastSeenAt: null,
        lastFingerprint: null,
        lastRunAt: null,
        lastStatus: 'skipped',
        lastMessage: 'Never run',
        robotsAllowed: null,
        notes: SOURCE_META[sourceId].notes,
      });
    }

    // Demo failed run for Phase 16 staff queue (illustrative; not a live scrape)
    const demoFail: IngestRun = {
      id: 'run_demo_failed',
      sourceId: 'clerk_agendas',
      status: 'failed',
      startedAt: '2026-07-28T18:00:00.000Z',
      finishedAt: '2026-07-28T18:00:02.000Z',
      message: 'Demo failure — robots hard-block / feed unreachable (seed)',
      diff: { added: 0, updated: 0, removed: 0, unchanged: 0 },
      fanout: [],
    };
    this.runs.unshift(demoFail);
    const wm = this.watermarks.get('clerk_agendas')!;
    wm.lastRunAt = demoFail.finishedAt;
    wm.lastStatus = 'failed';
    wm.lastMessage = demoFail.message;
    wm.robotsAllowed = false;
  }

  listSources() {
    return (Object.keys(SOURCE_META) as IngestSourceId[]).map((id) => ({
      id,
      label: SOURCE_META[id].label,
      watermark: this.watermarks.get(id)!,
    }));
  }

  getWatermark(sourceId: IngestSourceId) {
    return this.watermarks.get(sourceId) ?? null;
  }

  listRuns(limit = 50) {
    return this.runs.slice(0, limit);
  }

  startRun(sourceId: IngestSourceId): IngestRun {
    const run: IngestRun = {
      id: randomUUID(),
      sourceId,
      status: 'running',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      message: 'Running',
      diff: { added: 0, updated: 0, removed: 0, unchanged: 0 },
      fanout: [],
    };
    this.runs.unshift(run);
    return run;
  }

  finishRun(
    run: IngestRun,
    status: IngestRun['status'],
    message: string,
    diff: IngestRun['diff'],
    fanout: string[],
    fingerprint?: string,
    robotsAllowed?: boolean | null,
  ) {
    run.status = status;
    run.message = message;
    run.diff = diff;
    run.fanout = fanout;
    run.finishedAt = new Date().toISOString();

    const wm = this.watermarks.get(run.sourceId)!;
    wm.lastRunAt = run.finishedAt;
    wm.lastStatus = status;
    wm.lastMessage = message;
    if (robotsAllowed !== undefined) wm.robotsAllowed = robotsAllowed;
    if (fingerprint && status === 'succeeded') {
      wm.lastFingerprint = fingerprint;
      wm.lastSeenAt = run.finishedAt;
    }
    return run;
  }

  fingerprint(payload: unknown) {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
  }
}
