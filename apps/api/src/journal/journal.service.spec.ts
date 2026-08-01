import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';
import { MailService } from '../ops/mail.service';
import { JournalService } from './journal.service';

describe('JournalService', () => {
  const storePath = join(tmpdir(), `creek-journal-test-${Date.now()}.json`);

  beforeEach(() => {
    process.env.JOURNAL_STORE_PATH = storePath;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.JOURNAL_NOTIFY_EMAILS;
  });

  afterEach(() => {
    delete process.env.JOURNAL_STORE_PATH;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.JOURNAL_NOTIFY_EMAILS;
    vi.unstubAllGlobals();
  });

  function svc(mail?: MailService) {
    const j = new JournalService(mail ?? new MailService(), {
      listStaffEmails: () => ['staff@example.com'],
    } as never);
    j.onModuleInit();
    return j;
  }

  it('bootstraps seed posts with remote photo embeds', () => {
    const journal = svc();
    const list = journal.list(10);
    expect(list.count).toBeGreaterThanOrEqual(7);
    expect(list.posts[0]?.heroEmbed?.sourceUrl).toMatch(/^https?:\/\//);
    const detail = journal.getBySlug(list.posts[0]!.slug);
    expect(detail.embeds.length).toBeGreaterThan(0);
    expect(detail.embeds.some((e) => e.kind === 'photo' && e.imageUrl)).toBe(true);
  });

  it('ensureDailyPost is idempotent for the same Alaska day', async () => {
    const journal = svc();
    const a = await journal.ensureDailyPost();
    const b = await journal.ensureDailyPost();
    expect(a.post.publishDateAlaska).toBe(b.post.publishDateAlaska);
    expect(b.created).toBe(false);
  });

  it('sends weekly highlights via mail', async () => {
    process.env.JOURNAL_NOTIFY_EMAILS = 'ops@example.com';
    const mail = new MailService();
    const send = vi.spyOn(mail, 'send').mockResolvedValue({
      mode: 'stub',
      accepted: true,
      messageId: 'stub-1',
    });
    const journal = svc(mail);
    const result = await journal.sendWeeklyHighlights({ force: true, origin: 'https://example.com' });
    expect(result.skipped).toBe(false);
    if (!result.skipped) {
      expect(result.accepted).toBe(1);
      expect(result.postCount).toBeGreaterThan(0);
    }
    expect(send).toHaveBeenCalled();
    expect(String(send.mock.calls[0]?.[0]?.subject)).toMatch(/Journal/i);
  });
});
