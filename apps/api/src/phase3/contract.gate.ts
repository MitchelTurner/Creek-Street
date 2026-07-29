import { ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Phase 3 official workflow is contract-gated.
 * Until the borough is records custodian and this operator is processor under
 * a written agreement, deliberation features stay dark.
 *
 * Open Meetings Act (AS 44.62.310) + Public Records Act (AS 40.25) drive this.
 */
export type ContractStatus = {
  active: boolean;
  custodian: string | null;
  processor: string;
  agreementId: string | null;
  agreementEffective: string | null;
  retentionScheduleUrl: string | null;
  recordsRequestContact: string | null;
  omaNoticeIntegration: boolean;
  missing: string[];
  message: string;
};

@Injectable()
export class ContractGate {
  status(): ContractStatus {
    const activeFlag = (process.env.PHASE3_CONTRACT_ACTIVE ?? 'false').toLowerCase() === 'true';
    const custodian = process.env.PHASE3_CUSTODIAN?.trim() || null;
    const processor = process.env.PHASE3_PROCESSOR?.trim() || 'Mitchel Turner Dev, LLC';
    const agreementId = process.env.PHASE3_AGREEMENT_ID?.trim() || null;
    const agreementEffective = process.env.PHASE3_AGREEMENT_EFFECTIVE?.trim() || null;
    const retentionScheduleUrl = process.env.PHASE3_RETENTION_SCHEDULE_URL?.trim() || null;
    const recordsRequestContact = process.env.PHASE3_RECORDS_REQUEST_CONTACT?.trim() || null;
    const omaNoticeIntegration =
      (process.env.PHASE3_OMA_NOTICE_INTEGRATION ?? 'false').toLowerCase() === 'true';

    const missing: string[] = [];
    if (!activeFlag) missing.push('PHASE3_CONTRACT_ACTIVE=true');
    if (!custodian) missing.push('PHASE3_CUSTODIAN (borough as records custodian)');
    if (!agreementId) missing.push('PHASE3_AGREEMENT_ID');
    if (!agreementEffective) missing.push('PHASE3_AGREEMENT_EFFECTIVE');
    if (!retentionScheduleUrl) missing.push('PHASE3_RETENTION_SCHEDULE_URL');
    if (!recordsRequestContact) missing.push('PHASE3_RECORDS_REQUEST_CONTACT');
    if (!omaNoticeIntegration) missing.push('PHASE3_OMA_NOTICE_INTEGRATION=true');

    const active = missing.length === 0;

    return {
      active,
      custodian,
      processor,
      agreementId,
      agreementEffective,
      retentionScheduleUrl,
      recordsRequestContact,
      omaNoticeIntegration,
      missing,
      message: active
        ? 'Official workflow enabled under configured processor agreement.'
        : 'Official deliberation is dark until a borough MOU/contract makes the borough the records custodian and this operator the processor. Building deliberation before that agreement means building twice.',
    };
  }

  assertActive() {
    const s = this.status();
    if (!s.active) {
      throw new ForbiddenException({
        error: 'PHASE3_CONTRACT_REQUIRED',
        ...s,
      });
    }
    return s;
  }
}
