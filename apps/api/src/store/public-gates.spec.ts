import { describe, expect, it } from 'vitest';
import { applications } from '../data/phase0-seed';
import { meetingSummaries } from '../data/phase4-seed';
import { MemoryStore } from './memory.store';

describe('public legal gates', () => {
  it('never returns DRAFT applications from public list/get', () => {
    const store = new MemoryStore();
    const listed = store.listApplications();
    expect(listed.every((a) => a.status !== 'DRAFT')).toBe(true);

    const draft = applications.find((a) => a.status === 'DRAFT');
    if (draft) {
      expect(store.getApplication(draft.id)).toBeNull();
    }

    // Status filter must not override the public gate.
    expect(store.listApplications({ status: 'DRAFT' })).toEqual([]);
  });

  it('hides unpublished / unreviewed meeting summaries from public surfaces', () => {
    const store = new MemoryStore();
    const unpublished = meetingSummaries.find((s) => !s.isPublished || !s.reviewedAt);
    expect(unpublished).toBeTruthy();

    const published = meetingSummaries.filter((s) => s.isPublished && s.reviewedAt);
    expect(published.length).toBeGreaterThan(0);

    const meeting = store.getMeeting(unpublished!.meetingId);
    expect(meeting).toBeTruthy();
    expect(meeting!.summary).toBeNull();

    const reviewed = meetingSummaries.find((s) => s.isPublished && s.reviewedAt);
    if (reviewed) {
      const held = store.getMeeting(reviewed.meetingId);
      expect(held?.summary).toBeTruthy();
      expect(held?.summary?.humanReviewed).toBe(true);
    }
  });
});
