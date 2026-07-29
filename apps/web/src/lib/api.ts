const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type StructureSummary = {
  id: string;
  commonName: string | null;
  addressLabel: string;
  yearBuilt: number | null;
  nrhpContributing: boolean;
  publicSlug: string;
  centroid: { type: 'Point'; coordinates: [number, number] };
  sourceDocUrl: string;
  parcelId: string;
};

export type StructureDetail = StructureSummary & {
  historicNarrative: string;
  parcel: { id: string; parcelNumber: string; address: string } | null;
  applications: Application[];
  decisions: Decision[];
  photos: unknown[];
};

export type Application = {
  id: string;
  caseNumber: string | null;
  projectType: string;
  description: string;
  status: string;
  filedAt: string | null;
  sourceDocUrl: string | null;
  applicantName: string | null;
  structure?: StructureSummary | null;
  decisions?: Decision[];
};

export type Decision = {
  id: string;
  applicationId: string;
  recommendation: string;
  conditions: string | null;
  voteFor: number | null;
  voteAgainst: number | null;
  finalOutcome: string | null;
  sourceDocUrl: string;
  decidedAt: string | null;
  application?: Application | null;
};

export type Meeting = {
  id: string;
  scheduledAt: string;
  location: string;
  status: string;
  quorumMet: boolean | null;
  cancelReason: string | null;
  agendaUrl: string | null;
  minutesUrl: string | null;
  videoUrl: string | null;
  sourceDocUrl: string | null;
  agendaItems: { id: string; itemNumber: string; title: string; applicationId: string | null }[];
};

export type Seat = {
  id: string;
  label: string;
  seatType: string;
  isVacant: boolean;
  currentTerm: {
    memberName: string | null;
    termStart: string;
    termEnd: string;
  } | null;
};

export type GuidanceResponse = {
  sections: { id: string; title: string; plainLanguage: string; codeCite: string; codeText: string }[];
  criteria: { key: string; label: string; plainLanguage: string; codeCite: string; codeText: string }[];
  disclaimer: string;
};

export type Meta = {
  siteName: string;
  operator: string;
  notBoroughProperty: boolean;
  phase: number;
  nrhpReference: string;
  nrhpSourceUrl: string;
  zoningAdministratorContact: { label: string; url: string; note: string };
  applyForBoard: { label: string; url: string; note: string };
};

export type TriageFlow = {
  id: string;
  projectType: string;
  version: number;
  entryNodeId: string;
  tree: Array<
    | {
        id: string;
        kind: 'question';
        prompt: string;
        help?: string;
        options: { id: string; label: string; next: string }[];
      }
    | {
        id: string;
        kind: 'outcome';
        outcome: string;
        summary: string;
        codeCites: string[];
        criteria: string[];
        exhibits: string[];
        note: string;
      }
  >;
};

export type TriageEval =
  | {
      status: 'in_progress';
      current: {
        id: string;
        kind: 'question';
        prompt: string;
        help?: string;
        options: { id: string; label: string; next: string }[];
      };
      path: string[];
      zoningAdministrator: Meta['zoningAdministratorContact'];
      disclaimer: string;
    }
  | {
      status: 'complete';
      outcome: string;
      summary: string;
      codeCites: string[];
      criteria: string[];
      exhibits: string[];
      note: string;
      zoningAdministrator: Meta['zoningAdministratorContact'];
      disclaimer: string;
    }
  | { status: 'error'; message: string };

export type PermitTriggerResult = {
  query: Record<string, boolean>;
  includeUnverified: boolean;
  note: string;
  zoningAdministrator: Meta['zoningAdministratorContact'];
  results: Array<{
    id: string;
    permitName: string;
    statutoryCite: string;
    typicalLeadTimeDays: number | null;
    guidanceUrl: string | null;
    verifiedAt: string | null;
    verifiedNote: string | null;
    verified: boolean;
    agency: { name: string; shortName: string; jurisdiction: string; contactUrl: string };
  }>;
};

export type PrecedentRow = {
  id: string;
  decisionId: string;
  photoUrl: string;
  side: string;
  caption: string;
  sourceDocUrl: string;
  criterion: string;
  weight: string;
  decision: Decision | null;
  application: Application | null;
};

export type SimilarResult = {
  query: string;
  count: number;
  results: Array<{
    score: number;
    method: string;
    note: string;
    application: Application;
    decisions: Decision[];
  }>;
};

export const api = {
  meta: () => get<Meta>('/meta'),
  map: () => get<GeoJSON.FeatureCollection>('/map'),
  structures: (contributing?: boolean) => {
    const q =
      contributing === undefined ? '' : `?contributing=${contributing ? 'true' : 'false'}`;
    return get<StructureSummary[]>(`/structures${q}`);
  },
  structure: (slug: string) => get<StructureDetail>(`/structures/${slug}`),
  applications: (q?: string) => get<Application[]>(`/applications${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  decisions: (q?: string) => get<Decision[]>(`/decisions${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  meetings: () => get<Meeting[]>('/meetings'),
  guidance: () => get<GuidanceResponse>('/guidance'),
  seats: () => get<{ seats: Seat[]; apply: Meta['applyForBoard']; note: string }>('/board/seats'),
  openData: () => get<Record<string, unknown>>('/opendata'),
  triageFlows: () => get<Array<{ id: string; projectType: string; version: number }>>('/triage/flows'),
  triageFlow: (projectType: string) => get<TriageFlow>(`/triage/flows/${projectType}`),
  triageEvaluate: (projectType: string, answers: Record<string, string>) =>
    post<TriageEval>('/triage/evaluate', { projectType, answers }),
  permitTriggers: (params: Record<string, boolean>) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) qs.set(k, 'true');
    }
    return get<PermitTriggerResult>(`/permits/triggers?${qs.toString()}`);
  },
  precedents: (criterion?: string) =>
    get<PrecedentRow[]>(`/precedents${criterion ? `?criterion=${criterion}` : ''}`),
  similar: (q: string) => get<SimilarResult>(`/precedents/similar?q=${encodeURIComponent(q)}`),
};

declare namespace GeoJSON {
  interface FeatureCollection {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      properties: Record<string, unknown> | null;
      geometry: { type: string; coordinates: unknown };
    }>;
  }
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Juneau',
  });
}

export function statusLabel(status: string) {
  return status.replace(/_/g, ' ');
}
