import { Injectable } from '@nestjs/common';
import { applications, decisions, meetings, structures } from '../data/phase0-seed';
import { Phase1Service } from '../phase1/phase1.service';
import { ContractGate } from './contract.gate';

const PUBLIC_STATUSES = new Set([
  'FILED',
  'SCHEDULED',
  'BOARD_REVIEWED',
  'FORWARDED',
  'APPROVED',
  'APPROVED_W_CONDITIONS',
  'DENIED',
  'WITHDRAWN',
]);

@Injectable()
export class Phase3Service {
  constructor(
    private readonly contract: ContractGate,
    private readonly phase1: Phase1Service,
  ) {}

  boardDashboard() {
    const docket = applications
      .filter((a) => ['FILED', 'SCHEDULED', 'BOARD_REVIEWED', 'FORWARDED'].includes(a.status))
      .map((a) => ({
        ...a,
        structure: structures.find((s) => s.id === a.structureId) ?? null,
        decisions: decisions.filter((d) => d.applicationId === a.id),
      }));

    const upcoming = meetings
      .filter((m) => m.status === 'SCHEDULED')
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

    const pastMeetings = meetings
      .filter((m) => m.status === 'HELD')
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

    return {
      contract: this.contract.status(),
      constraints: {
        openMeetingsAct: 'AS 44.62.310 — no member-to-member substantive exchange on pending matters outside a noticed meeting.',
        publicRecordsAct: 'AS 40.25 — board records are public records; borough must be custodian before official workflow stores deliberation.',
        privateNotes:
          'MemberNotes are private scratch only: author-scoped, never shared, never attached to a decision record.',
      },
      docket,
      upcomingMeetings: upcoming,
      pastMeetings,
      deliberationEnabled: this.contract.status().active,
    };
  }

  applicationBoardView(id: string) {
    const app = applications.find((a) => a.id === id && PUBLIC_STATUSES.has(a.status));
    if (!app) return null;
    const similar = this.phase1.similarApplications(
      [app.description, ...decisions.filter((d) => d.applicationId === app.id).map((d) => d.recommendation)].join(
        ' ',
      ),
      5,
    );
    return {
      application: {
        ...app,
        structure: structures.find((s) => s.id === app.structureId) ?? null,
        decisions: decisions.filter((d) => d.applicationId === app.id),
        documents: [], // mirrored packet links would land here
      },
      similar: similar.results.filter((r) => r.application.id !== app.id),
      contract: this.contract.status(),
      privateNotesOnly:
        'Use private notes for personal scratch. Circulated comments require an active processor agreement.',
    };
  }
}
