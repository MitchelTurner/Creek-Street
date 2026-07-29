import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

/** PRIVATE. Author-scoped only. Never shared between members. Never public. */
export type MemberNoteRecord = {
  id: string;
  authorId: string;
  applicationId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

/** Contract-gated deliberation records — only writable when ContractGate is active. */
export type CirculatedComment = {
  id: string;
  applicationId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type CriterionScore = {
  id: string;
  applicationId: string;
  authorId: string;
  criterion: string;
  score: number;
  rationale: string;
  createdAt: string;
};

export type DraftFinding = {
  id: string;
  applicationId: string;
  authorId: string;
  body: string;
  status: 'DRAFT' | 'READY_FOR_PACKET';
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class BoardStore {
  private notes: MemberNoteRecord[] = [];
  private comments: CirculatedComment[] = [];
  private scores: CriterionScore[] = [];
  private findings: DraftFinding[] = [];

  // ── Private notes (always available to board members; never shared) ───────

  listNotes(authorId: string, applicationId?: string) {
    return this.notes
      .filter((n) => n.authorId === authorId && (!applicationId || n.applicationId === applicationId))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  createNote(authorId: string, applicationId: string, body: string) {
    const now = new Date().toISOString();
    const note: MemberNoteRecord = {
      id: randomUUID(),
      authorId,
      applicationId,
      body,
      createdAt: now,
      updatedAt: now,
    };
    this.notes.push(note);
    return note;
  }

  updateNote(authorId: string, id: string, body: string) {
    const note = this.notes.find((n) => n.id === id && n.authorId === authorId);
    if (!note) return null;
    note.body = body;
    note.updatedAt = new Date().toISOString();
    return note;
  }

  deleteNote(authorId: string, id: string) {
    const before = this.notes.length;
    this.notes = this.notes.filter((n) => !(n.id === id && n.authorId === authorId));
    return before !== this.notes.length;
  }

  exportNotes(authorId: string) {
    return {
      exportedAt: new Date().toISOString(),
      authorId,
      note: 'Private scratch notes for the exporting member only. Not shared. Not a decision record.',
      notes: this.listNotes(authorId),
    };
  }

  // ── Deliberation (contract-gated callers only) ────────────────────────────

  listComments(applicationId: string) {
    return this.comments
      .filter((c) => c.applicationId === applicationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  addComment(authorId: string, applicationId: string, body: string) {
    const row: CirculatedComment = {
      id: randomUUID(),
      applicationId,
      authorId,
      body,
      createdAt: new Date().toISOString(),
    };
    this.comments.push(row);
    return row;
  }

  listScores(applicationId: string) {
    return this.scores.filter((s) => s.applicationId === applicationId);
  }

  upsertScore(
    authorId: string,
    applicationId: string,
    criterion: string,
    score: number,
    rationale: string,
  ) {
    const existing = this.scores.find(
      (s) => s.authorId === authorId && s.applicationId === applicationId && s.criterion === criterion,
    );
    if (existing) {
      existing.score = score;
      existing.rationale = rationale;
      return existing;
    }
    const row: CriterionScore = {
      id: randomUUID(),
      applicationId,
      authorId,
      criterion,
      score,
      rationale,
      createdAt: new Date().toISOString(),
    };
    this.scores.push(row);
    return row;
  }

  listFindings(applicationId: string) {
    return this.findings.filter((f) => f.applicationId === applicationId);
  }

  upsertFinding(authorId: string, applicationId: string, body: string, status: 'DRAFT' | 'READY_FOR_PACKET') {
    let row = this.findings.find((f) => f.authorId === authorId && f.applicationId === applicationId);
    const now = new Date().toISOString();
    if (row) {
      row.body = body;
      row.status = status;
      row.updatedAt = now;
      return row;
    }
    row = {
      id: randomUUID(),
      applicationId,
      authorId,
      body,
      status,
      createdAt: now,
      updatedAt: now,
    };
    this.findings.push(row);
    return row;
  }

  assembleRecommendation(applicationId: string) {
    return {
      applicationId,
      assembledAt: new Date().toISOString(),
      comments: this.listComments(applicationId),
      scores: this.listScores(applicationId),
      findings: this.listFindings(applicationId).filter((f) => f.status === 'READY_FOR_PACKET'),
      note: 'Recommendation assembly for noticed public meeting use. Serial deliberation outside noticed meetings is prohibited (AS 44.62.310).',
    };
  }
}
