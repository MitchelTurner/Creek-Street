import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { MailService } from '../ops/mail.service';
import { ApplicantStore } from '../phase2/applicant.store';
import { MeetingOutcomesService } from '../phase3/meeting-outcomes.service';
import { CaseBriefService } from '../public/case-brief.service';
import { DigestService } from './digest.service';

function makeDigest(store = new ApplicantStore()) {
  const outcomes = new MeetingOutcomesService(
    { publishedSummaryForMeeting: () => null } as never,
    { status: () => ({ active: false, message: 'dark' }) } as never,
  );
  return new DigestService(store, new MailService(), outcomes, new CaseBriefService());
}

describe('DigestService', () => {
  it('builds a digest body with docket deep-links and calendar link', () => {
    const body = makeDigest().buildBody('https://example.test');
    expect(body).toContain('weekly digest');
    expect(body).toContain('https://example.test/api/meetings.ics');
    expect(body).toContain('https://example.test/docket/app_sample_pending');
    expect(body.toLowerCase()).not.toContain('must never be public');
    expect(body).not.toContain('app_sample_draft');
  });

  it('sends to confirmed email subscribers', async () => {
    delete process.env.SMTP_URL;
    const store = new ApplicantStore();
    store.createSubscription({
      userId: null,
      email: 'owner@example.com',
      scope: 'DISTRICT_WIDE',
      parcelId: null,
      centerPoint: null,
      radiusMeters: null,
      projectTypes: [],
      channel: 'EMAIL',
    });
    const digest = makeDigest(store);
    const result = await digest.sendWeekly('https://example.test');
    expect(result.recipients).toBe(1);
    expect(result.mode).toBe('stub');
    expect(digest.lastDigest()?.recipients).toBe(1);
  });

  it('builds outcomes digest for HELD meeting with case deep-links', () => {
    const { subject, body } = makeDigest().buildOutcomesBody(
      'mtg_2023_04',
      'https://example.test',
    );
    expect(subject).toContain('outcomes');
    expect(body).toContain('https://example.test/meetings/mtg_2023_04/outcomes');
    expect(body).toContain('https://example.test/docket/app_sample_sign');
    expect(body.toLowerCase()).not.toContain('must never be public');
  });

  it('rejects outcomes digest for scheduled meetings', () => {
    expect(() => makeDigest().buildOutcomesBody('mtg_2026_08')).toThrow(BadRequestException);
  });

  it('sends outcomes digest to confirmed subscribers', async () => {
    delete process.env.SMTP_URL;
    const store = new ApplicantStore();
    store.createSubscription({
      userId: null,
      email: 'owner@example.com',
      scope: 'DISTRICT_WIDE',
      parcelId: null,
      centerPoint: null,
      radiusMeters: null,
      projectTypes: [],
      channel: 'EMAIL',
    });
    const digest = makeDigest(store);
    const result = await digest.sendOutcomes('mtg_2023_04', 'https://example.test');
    expect(result.recipients).toBe(1);
    expect(result.kind).toBe('outcomes');
    expect(result.meetingId).toBe('mtg_2023_04');
    expect(digest.lastOutcomesDigest()?.recipients).toBe(1);
  });

  it('builds case digest from public brief facts', () => {
    const { subject, body } = makeDigest().buildCaseBody(
      'app_sample_sign',
      'https://example.test',
    );
    expect(subject).toContain('HDR-SAMPLE-001');
    expect(body).toContain('https://example.test/docket/app_sample_sign');
    expect(body).toContain('https://example.test/api/applications/app_sample_sign/brief.pdf');
    expect(body).toContain('Decisions:');
    expect(body.toLowerCase()).not.toContain('must never be public');
  });

  it('rejects case digest for DRAFT applications', () => {
    expect(() => makeDigest().buildCaseBody('app_sample_draft')).toThrow(NotFoundException);
  });

  it('sends case digest to confirmed subscribers', async () => {
    delete process.env.SMTP_URL;
    const store = new ApplicantStore();
    store.createSubscription({
      userId: null,
      email: 'owner@example.com',
      scope: 'DISTRICT_WIDE',
      parcelId: null,
      centerPoint: null,
      radiusMeters: null,
      projectTypes: [],
      channel: 'EMAIL',
    });
    const digest = makeDigest(store);
    const result = await digest.sendCase('app_sample_sign', 'https://example.test');
    expect(result.recipients).toBe(1);
    expect(result.kind).toBe('case');
    expect(result.applicationId).toBe('app_sample_sign');
    expect(digest.lastCaseDigest()?.recipients).toBe(1);
  });
});
