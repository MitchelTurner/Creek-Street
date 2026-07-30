import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'crypto';

export type UserRole = 'APPLICANT' | 'BOARD_MEMBER' | 'STAFF' | 'ADMIN';

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
};

export type SessionRecord = {
  token: string;
  userId: string;
  createdAt: string;
};

export type DraftDocument = {
  id: string;
  kind: string;
  fileName: string;
  storageKey: string;
  uploadedAt: string;
};

export type ApplicationDraft = {
  id: string;
  userId: string;
  parcelId: string | null;
  structureId: string | null;
  projectType: string;
  description: string;
  applicantName: string;
  triageOutcome: string | null;
  triageAnswers: Record<string, string>;
  criteria: string[];
  exhibitsRequired: string[];
  agencyTriggerIds: string[];
  documents: DraftDocument[];
  linkedCaseNumber: string | null;
  status: 'DRAFT' | 'PACKAGE_READY' | 'FILED_EXTERNALLY';
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionRecord = {
  id: string;
  userId: string | null;
  email: string;
  scope: 'PARCEL' | 'RADIUS' | 'PROJECT_TYPE' | 'DISTRICT_WIDE';
  parcelId: string | null;
  centerPoint: { type: 'Point'; coordinates: [number, number] } | null;
  radiusMeters: number | null;
  projectTypes: string[];
  channel: 'EMAIL' | 'RSS';
  confirmedAt: string | null;
  unsubToken: string;
  createdAt: string;
};

export type PhotoSubmission = {
  id: string;
  structureId: string;
  storageKey: string;
  caption: string;
  credit: string;
  yearApprox: number | null;
  submittedByUserId: string | null;
  submitterEmail: string;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

const REQUIRED_KINDS_BY_DEFAULT = [
  'SITE_PLAN',
  'ELEVATION',
  'PHOTO',
  'NARRATIVE',
  'MATERIALS',
];

@Injectable()
export class ApplicantStore {
  private users: UserRecord[] = [];
  private sessions: SessionRecord[] = [];
  private drafts: ApplicationDraft[] = [];
  private subscriptions: SubscriptionRecord[] = [];
  private photos: PhotoSubmission[] = [];
  private files = new Map<string, Buffer>();

  constructor() {
    // Demo users for local smoke tests
    const hash = bcrypt.hashSync('creek-demo', 8);
    const now = new Date().toISOString();
    this.users.push(
      {
        id: 'user_demo',
        email: 'applicant@example.com',
        passwordHash: hash,
        role: 'APPLICANT',
        createdAt: now,
      },
      {
        id: 'user_board',
        email: 'board@example.com',
        passwordHash: hash,
        role: 'BOARD_MEMBER',
        createdAt: now,
      },
      {
        id: 'user_staff',
        email: 'staff@example.com',
        passwordHash: hash,
        role: 'STAFF',
        createdAt: now,
      },
    );

    // Demo pending photo for Phase 16/18 staff queue + aging smoke tests (~72h old)
    const stalePhotoAt = new Date(Date.now() - 72 * 3600000).toISOString();
    this.photos.push({
      id: 'photo_pending_demo',
      structureId: 'struct_dollys',
      storageKey: 'photos/demo-pending.svg',
      caption: 'Demo historic boardwalk submission awaiting moderation',
      credit: 'applicant@example.com',
      yearApprox: 1918,
      submittedByUserId: 'user_demo',
      submitterEmail: 'applicant@example.com',
      moderationStatus: 'PENDING',
      createdAt: stalePhotoAt,
      reviewedAt: null,
      reviewedBy: null,
    });
  }

  async register(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    if (this.users.some((u) => u.email === normalized)) {
      throw new Error('Email already registered');
    }
    const user: UserRecord = {
      id: randomUUID(),
      email: normalized,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'APPLICANT',
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    return this.publicUser(user);
  }

  async login(email: string, password: string) {
    const user = this.users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return null;
    }
    const token = randomBytes(24).toString('hex');
    this.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    return { token, user: this.publicUser(user) };
  }

  logout(token: string) {
    this.sessions = this.sessions.filter((s) => s.token !== token);
  }

  userFromToken(token: string | undefined | null) {
    if (!token) return null;
    const session = this.sessions.find((s) => s.token === token);
    if (!session) return null;
    const user = this.users.find((u) => u.id === session.userId);
    return user ? this.publicUser(user) : null;
  }

  listDrafts(userId: string) {
    return this.drafts
      .filter((d) => d.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getDraft(userId: string, id: string) {
    const d = this.drafts.find((x) => x.id === id && x.userId === userId);
    return d ? this.withCompleteness(d) : null;
  }

  createDraft(
    userId: string,
    input: {
      projectType: string;
      description?: string;
      applicantName?: string;
      parcelId?: string | null;
      structureId?: string | null;
    },
  ) {
    const now = new Date().toISOString();
    const draft: ApplicationDraft = {
      id: randomUUID(),
      userId,
      parcelId: input.parcelId ?? null,
      structureId: input.structureId ?? null,
      projectType: input.projectType,
      description: input.description ?? '',
      applicantName: input.applicantName ?? '',
      triageOutcome: null,
      triageAnswers: {},
      criteria: [],
      exhibitsRequired: [...REQUIRED_KINDS_BY_DEFAULT],
      agencyTriggerIds: [],
      documents: [],
      linkedCaseNumber: null,
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
    };
    this.drafts.push(draft);
    return this.withCompleteness(draft);
  }

  updateDraft(userId: string, id: string, patch: Partial<ApplicationDraft>) {
    const d = this.drafts.find((x) => x.id === id && x.userId === userId);
    if (!d) return null;
    const allowed: (keyof ApplicationDraft)[] = [
      'parcelId',
      'structureId',
      'projectType',
      'description',
      'applicantName',
      'triageOutcome',
      'triageAnswers',
      'criteria',
      'exhibitsRequired',
      'agencyTriggerIds',
      'linkedCaseNumber',
      'status',
    ];
    for (const key of allowed) {
      if (patch[key] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d as any)[key] = patch[key];
      }
    }
    d.updatedAt = new Date().toISOString();
    return this.withCompleteness(d);
  }

  addDocument(
    userId: string,
    draftId: string,
    input: { kind: string; fileName: string; buffer: Buffer },
  ) {
    const d = this.drafts.find((x) => x.id === draftId && x.userId === userId);
    if (!d) return null;
    const storageKey = `drafts/${draftId}/${randomUUID()}-${input.fileName}`;
    this.files.set(storageKey, input.buffer);
    const doc: DraftDocument = {
      id: randomUUID(),
      kind: input.kind,
      fileName: input.fileName,
      storageKey,
      uploadedAt: new Date().toISOString(),
    };
    d.documents.push(doc);
    d.updatedAt = new Date().toISOString();
    return this.withCompleteness(d);
  }

  getFile(storageKey: string) {
    return this.files.get(storageKey) ?? null;
  }

  createSubscription(input: Omit<SubscriptionRecord, 'id' | 'unsubToken' | 'createdAt' | 'confirmedAt'> & {
    confirmed?: boolean;
  }) {
    const row: SubscriptionRecord = {
      id: randomUUID(),
      userId: input.userId,
      email: input.email.trim().toLowerCase(),
      scope: input.scope,
      parcelId: input.parcelId,
      centerPoint: input.centerPoint,
      radiusMeters: input.radiusMeters,
      projectTypes: input.projectTypes,
      channel: input.channel,
      confirmedAt: input.confirmed === false ? null : new Date().toISOString(),
      unsubToken: randomBytes(16).toString('hex'),
      createdAt: new Date().toISOString(),
    };
    this.subscriptions.push(row);
    return row;
  }

  listSubscriptions(userId: string) {
    return this.subscriptions.filter((s) => s.userId === userId);
  }

  unsubscribe(token: string) {
    const before = this.subscriptions.length;
    this.subscriptions = this.subscriptions.filter((s) => s.unsubToken !== token);
    return before !== this.subscriptions.length;
  }

  rssFeed() {
    return this.subscriptions.filter((s) => s.channel === 'RSS' && s.confirmedAt);
  }

  listStaffEmails() {
    return this.users
      .filter((u) => u.role === 'STAFF' || u.role === 'ADMIN')
      .map((u) => u.email)
      .sort();
  }

  listConfirmedEmailSubscriptions() {
    return this.subscriptions.filter((s) => s.channel === 'EMAIL' && s.confirmedAt);
  }

  /** All confirmed subscriptions (email + RSS) for ingest fanout. */
  listConfirmedSubscriptions() {
    return this.subscriptions.filter((s) => s.confirmedAt);
  }

  /** Applicant-owned data package (no password hashes / session tokens). */
  exportAccount(userId: string) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return null;
    return {
      exportedAt: new Date().toISOString(),
      user: this.publicUser(user),
      drafts: this.listDrafts(userId),
      subscriptions: this.listSubscriptions(userId).map((s) => ({
        id: s.id,
        email: s.email,
        scope: s.scope,
        channel: s.channel,
        projectTypes: s.projectTypes,
        createdAt: s.createdAt,
        confirmedAt: s.confirmedAt,
      })),
      photosSubmitted: this.photos
        .filter((p) => p.submittedByUserId === userId)
        .map((p) => ({
          id: p.id,
          structureId: p.structureId,
          caption: p.caption,
          credit: p.credit,
          yearApprox: p.yearApprox,
          moderationStatus: p.moderationStatus,
          createdAt: p.createdAt,
        })),
      note: 'Preparation materials only — not borough board records. Password hashes and session tokens are never exported.',
    };
  }

  /** Soft-delete account data owned by the user. Demo accounts are protected. */
  deleteAccount(userId: string) {
    const DEMO = new Set(['user_demo', 'user_board', 'user_staff']);
    if (DEMO.has(userId)) {
      return { ok: false as const, reason: 'Demo accounts cannot be deleted.' };
    }
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { ok: false as const, reason: 'User not found' };

    const draftIds = new Set(this.drafts.filter((d) => d.userId === userId).map((d) => d.id));
    for (const d of this.drafts.filter((x) => x.userId === userId)) {
      for (const doc of d.documents) this.files.delete(doc.storageKey);
    }
    this.drafts = this.drafts.filter((d) => d.userId !== userId);
    this.subscriptions = this.subscriptions.filter((s) => s.userId !== userId);
    for (const p of this.photos.filter((x) => x.submittedByUserId === userId)) {
      this.files.delete(p.storageKey);
    }
    this.photos = this.photos.filter((p) => p.submittedByUserId !== userId);
    this.sessions = this.sessions.filter((s) => s.userId !== userId);
    this.users = this.users.filter((u) => u.id !== userId);
    return {
      ok: true as const,
      deletedDrafts: draftIds.size,
      email: user.email,
    };
  }

  submitPhoto(input: Omit<PhotoSubmission, 'id' | 'createdAt' | 'moderationStatus' | 'reviewedAt' | 'reviewedBy' | 'storageKey'> & {
    buffer: Buffer;
    fileName: string;
  }) {
    const storageKey = `photos/${randomUUID()}-${input.fileName}`;
    this.files.set(storageKey, input.buffer);
    const row: PhotoSubmission = {
      id: randomUUID(),
      structureId: input.structureId,
      storageKey,
      caption: input.caption,
      credit: input.credit,
      yearApprox: input.yearApprox,
      submittedByUserId: input.submittedByUserId,
      submitterEmail: input.submitterEmail,
      moderationStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    };
    this.photos.push(row);
    return row;
  }

  listPendingPhotos() {
    return this.photos.filter((p) => p.moderationStatus === 'PENDING');
  }

  listApprovedPhotos(structureId?: string) {
    return this.photos.filter(
      (p) => p.moderationStatus === 'APPROVED' && (!structureId || p.structureId === structureId),
    );
  }

  moderatePhoto(id: string, status: 'APPROVED' | 'REJECTED', reviewer: string) {
    const p = this.photos.find((x) => x.id === id);
    if (!p) return null;
    p.moderationStatus = status;
    p.reviewedAt = new Date().toISOString();
    p.reviewedBy = reviewer;
    return p;
  }

  private withCompleteness(d: ApplicationDraft) {
    const present = new Set(d.documents.map((x) => x.kind));
    const missing = d.exhibitsRequired.filter((k) => !present.has(k));
    const complete = missing.length === 0 && Boolean(d.description.trim()) && Boolean(d.projectType);
    return {
      ...d,
      completeness: {
        complete,
        missingKinds: missing,
        uploadedKinds: [...present],
        requiredKinds: d.exhibitsRequired,
      },
    };
  }

  private publicUser(user: UserRecord) {
    return { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt };
  }
}
