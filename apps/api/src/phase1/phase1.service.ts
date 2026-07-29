import { Injectable } from '@nestjs/common';
import { applications, decisions, meta } from '../data/phase0-seed';
import {
  agencies,
  permitTriggers,
  precedentExemplars,
  triageFlows,
  type TriageNode,
  type TriageOutcomeKind,
} from '../data/phase1-seed';
import { buildIdf, cosine, tfidfVector, tokenize } from './similarity';

export type PermitQuery = {
  inHdZone?: boolean;
  exteriorChange?: boolean;
  overWater?: boolean;
  inWater?: boolean;
  substructure?: boolean;
  groundDisturbing?: boolean;
  structural?: boolean;
  occupancyChange?: boolean;
  fill?: boolean;
  wastewater?: boolean;
  federalNexus?: boolean;
  includeUnverified?: boolean;
};

@Injectable()
export class Phase1Service {
  private readonly idf: Map<string, number>;
  private readonly index: {
    applicationId: string;
    sourceText: string;
    tokens: string[];
    vector: Map<string, number>;
  }[];

  constructor() {
    const docs = applications.map((a) => {
      const decs = decisions.filter((d) => d.applicationId === a.id);
      const text = [a.description, a.projectType, ...decs.map((d) => `${d.recommendation} ${d.finalOutcome ?? ''}`)].join(
        ' ',
      );
      return { applicationId: a.id, sourceText: text, tokens: tokenize(text) };
    });
    this.idf = buildIdf(docs.map((d) => d.tokens));
    this.index = docs.map((d) => ({
      ...d,
      vector: tfidfVector(d.tokens, this.idf),
    }));
  }

  listTriageFlows() {
    return triageFlows
      .filter((f) => f.isPublished)
      .map((f) => ({
        id: f.id,
        projectType: f.projectType,
        version: f.version,
        reviewedBy: f.reviewedBy,
        reviewedAt: f.reviewedAt,
        entryNodeId: f.entryNodeId,
      }));
  }

  getTriageFlow(projectType: string) {
    const flow = triageFlows
      .filter((f) => f.isPublished && f.projectType === projectType)
      .sort((a, b) => b.version - a.version)[0];
    if (!flow) return null;
    return flow;
  }

  evaluateTriage(projectType: string, answers: Record<string, string>) {
    const flow = this.getTriageFlow(projectType);
    if (!flow) return null;

    const byId = new Map(flow.tree.map((n) => [n.id, n]));
    let node: TriageNode | undefined = byId.get(flow.entryNodeId);
    const path: string[] = [];

    while (node && node.kind === 'question') {
      path.push(node.id);
      const answer = answers[node.id];
      if (!answer) {
        return {
          status: 'in_progress' as const,
          flowId: flow.id,
          projectType: flow.projectType,
          version: flow.version,
          path,
          current: node,
          zoningAdministrator: meta.zoningAdministratorContact,
          disclaimer:
            'This wizard states what the code says and who decides. It is not a legal conclusion.',
        };
      }
      const opt = node.options.find((o) => o.id === answer);
      if (!opt) {
        return { status: 'error' as const, message: `Invalid answer for ${node.id}` };
      }
      node = byId.get(opt.next);
    }

    if (!node || node.kind !== 'outcome') {
      return { status: 'error' as const, message: 'Triage path did not resolve to an outcome' };
    }

    return {
      status: 'complete' as const,
      flowId: flow.id,
      projectType: flow.projectType,
      version: flow.version,
      path,
      outcome: node.outcome as TriageOutcomeKind,
      summary: node.summary,
      codeCites: node.codeCites,
      criteria: node.criteria,
      exhibits: node.exhibits,
      note: node.note,
      zoningAdministrator: meta.zoningAdministratorContact,
      disclaimer:
        'This wizard states what the code says and who decides. It is not a legal conclusion.',
    };
  }

  listAgencies() {
    return agencies;
  }

  matchPermitTriggers(query: PermitQuery) {
    const includeUnverified = Boolean(query.includeUnverified);
    const flags = {
      inHdZone: Boolean(query.inHdZone),
      exteriorChange: Boolean(query.exteriorChange),
      overWater: Boolean(query.overWater),
      inWater: Boolean(query.inWater),
      substructure: Boolean(query.substructure),
      groundDisturbing: Boolean(query.groundDisturbing),
      structural: Boolean(query.structural),
      occupancyChange: Boolean(query.occupancyChange),
      fill: Boolean(query.fill),
      wastewater: Boolean(query.wastewater),
      federalNexus: Boolean(query.federalNexus),
    };

    const matched = permitTriggers
      .filter((t) => (includeUnverified ? true : Boolean(t.verifiedAt)))
      .map((t) => {
        const agency = agencies.find((a) => a.id === t.agencyId)!;
        const conditionKeys = Object.keys(t.conditions).filter((k) => t.conditions[k] === true);
        const hit = conditionKeys.length === 0 || conditionKeys.some((k) => flags[k as keyof typeof flags]);
        return {
          ...t,
          agency,
          matched: hit,
          verified: Boolean(t.verifiedAt),
        };
      })
      .filter((t) => t.matched)
      .sort((a, b) => Number(b.verified) - Number(a.verified));

    return {
      query: flags,
      includeUnverified,
      results: matched,
      note: includeUnverified
        ? 'Includes unverified triggers. Treat unverified rows as research leads, not advice.'
        : 'Showing verified triggers only. Pass includeUnverified=true to see research leads.',
      zoningAdministrator: meta.zoningAdministratorContact,
    };
  }

  listPrecedents(criterion?: string) {
    let rows = [...precedentExemplars];
    if (criterion) rows = rows.filter((r) => r.criterion === criterion);
    return rows.map((r) => {
      const decision = decisions.find((d) => d.id === r.decisionId) ?? null;
      const application = decision
        ? applications.find((a) => a.id === decision.applicationId) ?? null
        : null;
      return { ...r, decision, application };
    });
  }

  similarApplications(text: string, limit = 5) {
    const qVec = tfidfVector(tokenize(text), this.idf);
    const scored = this.index
      .map((row) => ({
        applicationId: row.applicationId,
        score: cosine(qVec, row.vector),
        sourceText: row.sourceText,
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => {
        const application = applications.find((a) => a.id === r.applicationId)!;
        const decs = decisions.filter((d) => d.applicationId === r.applicationId);
        return {
          score: Number(r.score.toFixed(4)),
          application,
          decisions: decs,
          method: 'tfidf-cosine',
          note: 'Lexical similarity over mirrored descriptions and decisions. pgvector embeddings replace this index in a later cut.',
        };
      });

    return {
      query: text,
      results: scored,
      count: scored.length,
    };
  }
}
