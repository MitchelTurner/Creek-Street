import { afterEach, describe, expect, it, vi } from 'vitest';
import { MailService } from '../ops/mail.service';
import { AiIdeasService } from './ai-ideas.service';

describe('AiIdeasService', () => {
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.IDEA_NOTIFY_EMAILS;
    delete process.env.IDEA_AI_AUTO_NOTIFY;
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_URL;
    vi.unstubAllGlobals();
  });

  function svc(mail?: MailService) {
    return new AiIdeasService(mail ?? new MailService(), {
      listStaffEmails: () => ['staff@example.com'],
    } as never);
  }

  it('reports unconfigured without ANTHROPIC_API_KEY', () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(svc().status().configured).toBe(false);
  });

  it('generates a post from Claude JSON and can email notify recipients', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.IDEA_NOTIFY_EMAILS = 'ops@example.com, team@example.com';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                headline: 'Lantern walks × maker leases',
                lede: 'Shoulder-season culture that fills storefronts.',
                suggestions: [
                  {
                    pillar: 'CULTURE',
                    title: 'Winter lantern heritage walk',
                    summary: 'Low-impact evening walks.',
                    whyItFits: 'Off-season presence without façade changes.',
                    nextStep: 'Run temporary-use triage first.',
                    tags: ['winter', 'events'],
                  },
                  {
                    pillar: 'BUSINESS',
                    title: 'Maker micro-leases',
                    summary: 'Short booths for local makers.',
                    whyItFits: 'Keeps commerce authentic.',
                    nextStep: 'Map vacant frontages.',
                    tags: ['retail'],
                  },
                  {
                    pillar: 'REVENUE',
                    title: 'Event permit package',
                    summary: 'Bundled shoulder-season fees.',
                    whyItFits: 'Predictable municipal revenue.',
                    nextStep: 'Publish fee schedule.',
                    tags: ['fees'],
                  },
                ],
                playbook: ['Confirm with Zoning Administrator.'],
              }),
            },
          ],
        }),
      }),
    );

    const mail = new MailService();
    const send = vi.spyOn(mail, 'send').mockResolvedValue({
      mode: 'stub',
      accepted: true,
      messageId: 'stub-1',
    });

    const ideas = svc(mail);
    const row = await ideas.suggest({
      focus: 'ALL',
      notes: 'Focus on shoulder season',
      notify: true,
      origin: 'https://creek-street.example',
    });

    expect(row.headline).toContain('Lantern');
    expect(row.suggestions).toHaveLength(3);
    expect(row.notify?.recipients).toBe(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect(ideas.listPosts().count).toBe(1);
  });

  it('throws when Anthropic key missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(svc().suggest({ focus: 'CULTURE' })).rejects.toThrow(/ANTHROPIC_API_KEY|not configured/i);
  });
});
