import { Injectable } from '@nestjs/common';
import { ContractGate } from '../phase3/contract.gate';
import { AuditStore } from './audit.store';

/**
 * Processor / Public Records Act readiness checklist.
 * Surfaces what must be true before this operator holds board records.
 */
@Injectable()
export class ComplianceService {
  constructor(
    private readonly contract: ContractGate,
    private readonly audit: AuditStore,
  ) {}

  retentionPolicy() {
    const contract = this.contract.status();
    return {
      title: 'Records retention & Public Records Act posture',
      operator: contract.processor,
      custodian: contract.custodian,
      retentionScheduleUrl: contract.retentionScheduleUrl,
      recordsRequestContact: contract.recordsRequestContact,
      principles: [
        {
          id: 'not-custodian-by-default',
          text: 'Until a written borough agreement says otherwise, Mitchel Turner Dev, LLC is not the custodian of board records under AS 40.25.',
        },
        {
          id: 'mirror-only',
          text: 'The public hub mirrors published facts. Applicant DRAFT materials and MemberNotes are private preparation / scratch — not board records.',
        },
        {
          id: 'member-notes',
          text: 'MemberNotes are author-scoped only, exportable by that member, never joined into public queries or decision packets.',
        },
        {
          id: 'ai-summaries',
          text: 'AI meeting summaries stay unpublished until human review sets isPublished after reviewedAt.',
        },
        {
          id: 'oma',
          text: 'Board deliberation never happens in this app outside a noticed public meeting (AS 44.62.310).',
        },
      ],
      scheduleConfigured: Boolean(contract.retentionScheduleUrl),
      contactConfigured: Boolean(contract.recordsRequestContact),
    };
  }

  readinessChecklist() {
    const contract = this.contract.status();
    const items = [
      {
        id: 'public-mirror',
        label: 'Public mirror live without claiming borough ownership',
        done: true,
        detail: 'Operator disclaimer on every surface.',
      },
      {
        id: 'draft-gate',
        label: 'DRAFT applications never public',
        done: true,
        detail: 'Enforced in MemoryStore + Vitest gates.',
      },
      {
        id: 'summary-gate',
        label: 'Unreviewed AI summaries never public',
        done: true,
        detail: 'Requires isPublished + reviewedAt.',
      },
      {
        id: 'robots',
        label: 'Ingest respects robots.txt / borough hard-block',
        done: true,
        detail: 'borough.ketchikan.ak.us blocked; fail closed.',
      },
      {
        id: 'audit-log',
        label: 'Staff-action audit log available',
        done: true,
        detail: 'GET /api/compliance/audit (staff).',
      },
      {
        id: 'applicant-export',
        label: 'Applicant can export / delete their account data',
        done: true,
        detail: 'GET /api/applicant/export · DELETE /api/applicant/account',
      },
      {
        id: 'retention-url',
        label: 'Retention schedule URL configured',
        done: Boolean(contract.retentionScheduleUrl),
        detail: contract.retentionScheduleUrl ?? 'Set PHASE3_RETENTION_SCHEDULE_URL',
      },
      {
        id: 'records-contact',
        label: 'Records request contact configured',
        done: Boolean(contract.recordsRequestContact),
        detail: contract.recordsRequestContact ?? 'Set PHASE3_RECORDS_REQUEST_CONTACT',
      },
      {
        id: 'custodian',
        label: 'Borough named as records custodian',
        done: Boolean(contract.custodian),
        detail: contract.custodian ?? 'Set PHASE3_CUSTODIAN',
      },
      {
        id: 'oma-integration',
        label: 'OMA notice integration acknowledged',
        done: contract.omaNoticeIntegration,
        detail: 'PHASE3_OMA_NOTICE_INTEGRATION=true',
      },
      {
        id: 'processor-agreement',
        label: 'Full processor agreement unlocks deliberation',
        done: contract.active,
        detail: contract.active
          ? `Agreement ${contract.agreementId} effective ${contract.agreementEffective}`
          : `Missing: ${contract.missing.join(', ') || 'flags'}`,
      },
    ];

    const done = items.filter((i) => i.done).length;
    return {
      title: 'Borough / processor readiness',
      contract,
      items,
      score: { done, total: items.length },
      deliberationUnlocked: contract.active,
      recentAudit: this.audit.list({ limit: 5 }),
      message: contract.message,
    };
  }
}
