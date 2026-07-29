export type IngestSourceId =
  | 'clerk_agendas'
  | 'borough_gis'
  | 'nrhp_seed'
  | 'ktnport_ships'
  | 'embedding_refresh'
  | 'meeting_summaries';

export type IngestRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'skipped';

export type SourceWatermark = {
  sourceId: IngestSourceId;
  lastSeenAt: string | null;
  lastFingerprint: string | null;
  lastRunAt: string | null;
  lastStatus: IngestRunStatus;
  lastMessage: string | null;
  robotsAllowed: boolean | null;
  notes: string;
};

export type IngestRun = {
  id: string;
  sourceId: IngestSourceId;
  status: IngestRunStatus;
  startedAt: string;
  finishedAt: string | null;
  message: string;
  diff: {
    added: number;
    updated: number;
    removed: number;
    unchanged: number;
  };
  fanout: string[];
};

export type IngestAdapterResult = {
  fingerprint: string;
  message: string;
  diff: IngestRun['diff'];
  fanout: string[];
  skipped?: boolean;
};
