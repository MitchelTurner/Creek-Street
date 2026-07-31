import { Injectable, NotFoundException } from '@nestjs/common';
import { applications, decisions } from '../data/phase0-seed';
import { precedentExemplars } from '../data/phase1-seed';
import { PUBLIC_STATUS_SET } from '../store/public-statuses';

/**
 * Phase 32 — side-by-side precedent compare from published exemplar seeds.
 */
@Injectable()
export class PrecedentCompareService {
  compare(leftId: string, rightId: string) {
    const left = this.load(leftId);
    const right = this.load(rightId);
    const sameCriterion = left.criterion === right.criterion ? left.criterion : null;
    const sameDecision = left.decisionId === right.decisionId;
    const sideContrast =
      left.side !== right.side ? `${left.side.replace(/_/g, ' ')} vs ${right.side.replace(/_/g, ' ')}` : left.side;

    return {
      left,
      right,
      analysis: {
        sameCriterion,
        sameDecision,
        sideContrast,
        weightContrast:
          left.weight !== right.weight
            ? `${left.weight} vs ${right.weight}`
            : left.weight,
        teachingPrompt: sameCriterion
          ? `Both examples touch ${sameCriterion.replace(/_/g, ' ')}. Compare material / signage / massing cues that differ between the ${left.side.replace(/_/g, ' ').toLowerCase()} and ${right.side.replace(/_/g, ' ').toLowerCase()} frames.`
          : 'These examples sit under different criteria — use them to contrast how the Board treats distinct review topics.',
      },
      defaults: {
        left: 'ex_sign_proposed',
        right: 'ex_sign_after',
      },
    };
  }

  private load(id: string) {
    const row = precedentExemplars.find((r) => r.id === id);
    if (!row) throw new NotFoundException(`Precedent ${id} not found`);
    const decision = decisions.find((d) => d.id === row.decisionId) ?? null;
    const application = decision
      ? applications.find(
          (a) => a.id === decision.applicationId && PUBLIC_STATUS_SET.has(a.status),
        ) ?? null
      : null;
    return {
      id: row.id,
      photoUrl: row.photoUrl,
      side: row.side,
      caption: row.caption,
      sourceDocUrl: row.sourceDocUrl,
      criterion: row.criterion,
      weight: row.weight,
      decisionId: row.decisionId,
      decision: decision
        ? {
            id: decision.id,
            recommendation: decision.recommendation,
            decidedAt: decision.decidedAt,
            ui: `/decisions/${decision.id}`,
          }
        : null,
      application: application
        ? {
            id: application.id,
            caseNumber: application.caseNumber,
            projectType: application.projectType,
            status: application.status,
            ui: `/docket/${application.id}`,
          }
        : null,
      criterionUi: `/guidance/criteria/${row.criterion}`,
    };
  }
}
