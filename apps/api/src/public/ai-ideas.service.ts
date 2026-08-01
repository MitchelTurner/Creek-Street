import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MailService } from '../ops/mail.service';
import { ApplicantStore } from '../phase2/applicant.store';
import type { IdeaPillar } from '../data/civic-ideas-seed';
import { ideaPillars } from '../data/civic-ideas-seed';

export type AiSuggestion = {
  pillar: IdeaPillar;
  title: string;
  summary: string;
  whyItFits: string;
  nextStep: string;
  tags: string[];
};

export type IdeaPost = {
  id: string;
  createdAt: string;
  focus: IdeaPillar | 'ALL';
  notes: string;
  model: string;
  headline: string;
  lede: string;
  suggestions: AiSuggestion[];
  playbook: string[];
  notifiedAt: string | null;
  notifyRecipients: string[];
  source: 'claude';
  disclaimer: string;
};

type ClaudeBrief = {
  headline: string;
  lede: string;
  suggestions: AiSuggestion[];
  playbook: string[];
};

const DISCLAIMER =
  'AI ideation aid operated by Mitchel Turner Dev, LLC — not a borough property. Not City of Ketchikan or Ketchikan Gateway Borough policy, not a filing, and not legal advice.';

@Injectable()
export class AiIdeasService {
  private readonly log = new Logger(AiIdeasService.name);
  private posts: IdeaPost[] = [];
  private seq = 0;

  constructor(
    private readonly mail: MailService,
    private readonly applicants: ApplicantStore,
  ) {}

  status() {
    const key = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
    return {
      configured: key,
      model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-20250514',
      mail: this.mail.status(),
      notifyRecipients: this.resolveRecipients().length,
      posts: this.posts.length,
      autoNotifyDefault: (process.env.IDEA_AI_AUTO_NOTIFY ?? 'false').toLowerCase() === 'true',
    };
  }

  listPosts(limit = 20) {
    const n = Math.min(Math.max(limit, 1), 50);
    return {
      count: this.posts.length,
      posts: this.posts.slice(0, n).map((p) => this.publicPost(p)),
      disclaimer: DISCLAIMER,
    };
  }

  getPost(id: string) {
    const row = this.posts.find((p) => p.id === id);
    if (!row) return null;
    return this.publicPost(row);
  }

  async suggest(input: {
    focus?: string;
    notes?: string;
    notify?: boolean;
    origin?: string;
  }) {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException({
        error: 'ANTHROPIC_NOT_CONFIGURED',
        message:
          'Set ANTHROPIC_API_KEY on the API to enable Claude suggestions. Curated /ideas/generate still works without it.',
      });
    }

    const focus = normalizeFocus(input.focus);
    const notes = (input.notes ?? '').trim().slice(0, 1200);
    const model = process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-20250514';
    const brief = await this.callClaude({ apiKey, model, focus, notes });

    this.seq += 1;
    const post: IdeaPost = {
      id: `idea_ai_${Date.now().toString(36)}_${this.seq}`,
      createdAt: new Date().toISOString(),
      focus,
      notes,
      model,
      headline: brief.headline,
      lede: brief.lede,
      suggestions: brief.suggestions,
      playbook: brief.playbook,
      notifiedAt: null,
      notifyRecipients: [],
      source: 'claude',
      disclaimer: DISCLAIMER,
    };
    this.posts.unshift(post);
    if (this.posts.length > 100) this.posts.length = 100;

    const auto =
      input.notify === true ||
      (input.notify !== false &&
        (process.env.IDEA_AI_AUTO_NOTIFY ?? 'false').toLowerCase() === 'true');

    let notify: Awaited<ReturnType<AiIdeasService['notifyPost']>> | null = null;
    if (auto) {
      notify = await this.notifyPost(post.id, input.origin);
    }

    return {
      ...this.publicPost(post),
      notify,
    };
  }

  async notifyPost(id: string, origin?: string) {
    const post = this.posts.find((p) => p.id === id);
    if (!post) {
      throw new BadRequestException({ error: 'NOT_FOUND', message: 'Idea post not found' });
    }

    const recipients = this.resolveRecipients();
    if (!recipients.length) {
      throw new ServiceUnavailableException({
        error: 'NO_NOTIFY_RECIPIENTS',
        message:
          'Set IDEA_NOTIFY_EMAILS (comma-separated) or ensure STAFF/ADMIN users exist to receive suggestion emails.',
      });
    }

    const webOrigin = (origin || process.env.PUBLIC_WEB_ORIGIN || 'https://creek-street.local').replace(
      /\/$/,
      '',
    );
    const subject = `Creek Street civic idea — ${post.headline.slice(0, 80)}`;
    const text = this.buildEmailText(post, webOrigin);
    const html = this.buildEmailHtml(post, webOrigin);

    const results = [];
    for (const to of recipients) {
      results.push(await this.mail.send({ to, subject, text, html }));
    }

    post.notifiedAt = new Date().toISOString();
    post.notifyRecipients = recipients;
    this.log.log(
      `Idea post ${post.id} emailed recipients=${recipients.length} mode=${this.mail.status().mode}`,
    );

    return {
      postId: post.id,
      at: post.notifiedAt,
      recipients: recipients.length,
      mode: this.mail.status().mode,
      accepted: results.filter((r) => r.accepted).length,
      failed: results.filter((r) => !r.accepted).length,
    };
  }

  /** Test helper — seed a post without Claude. */
  __pushForTest(post: IdeaPost) {
    this.posts.unshift(post);
  }

  __resetForTest() {
    this.posts = [];
    this.seq = 0;
  }

  private resolveRecipients(): string[] {
    const raw = process.env.IDEA_NOTIFY_EMAILS?.trim();
    if (raw) {
      return [
        ...new Set(
          raw
            .split(/[,;\s]+/)
            .map((e) => e.trim().toLowerCase())
            .filter((e) => e.includes('@')),
        ),
      ];
    }
    return this.applicants.listStaffEmails().map((e) => e.toLowerCase());
  }

  private publicPost(post: IdeaPost) {
    return {
      id: post.id,
      createdAt: post.createdAt,
      focus: post.focus,
      notes: post.notes,
      model: post.model,
      headline: post.headline,
      lede: post.lede,
      suggestions: post.suggestions,
      playbook: post.playbook,
      notifiedAt: post.notifiedAt,
      notifyRecipientCount: post.notifyRecipients.length,
      source: post.source,
      disclaimer: post.disclaimer,
      href: `/ideas?post=${post.id}`,
    };
  }

  private buildEmailText(post: IdeaPost, origin: string) {
    const lines = [
      'Creek Street Design Review Hub — AI civic idea brief',
      '',
      DISCLAIMER,
      '',
      post.headline,
      post.lede,
      '',
      `Focus: ${post.focus}`,
      post.notes ? `Notes: ${post.notes}` : null,
      `Model: ${post.model}`,
      '',
      'Suggestions:',
      ...post.suggestions.flatMap((s, i) => [
        `${i + 1}. [${s.pillar}] ${s.title}`,
        `   ${s.summary}`,
        `   Why: ${s.whyItFits}`,
        `   Next: ${s.nextStep}`,
        '',
      ]),
      'Playbook:',
      ...post.playbook.map((p) => `• ${p}`),
      '',
      `Open on hub: ${origin}/ideas?post=${post.id}`,
      `${origin}/ideas`,
    ];
    return lines.filter((x) => x != null).join('\n');
  }

  private buildEmailHtml(post: IdeaPost, origin: string) {
    const items = post.suggestions
      .map(
        (s) => `
      <li style="margin-bottom:1rem">
        <strong>[${escapeHtml(s.pillar)}] ${escapeHtml(s.title)}</strong>
        <div style="margin-top:0.35rem;color:#334">${escapeHtml(s.summary)}</div>
        <div style="margin-top:0.25rem;font-size:0.9rem;color:#556"><em>Why:</em> ${escapeHtml(s.whyItFits)}</div>
        <div style="margin-top:0.25rem;font-size:0.9rem;color:#0f4f4d"><em>Next:</em> ${escapeHtml(s.nextStep)}</div>
      </li>`,
      )
      .join('');
    return `
      <div style="font-family:Georgia,serif;line-height:1.5;color:#071312;max-width:640px">
        <p style="font-size:0.85rem;color:#666">${escapeHtml(DISCLAIMER)}</p>
        <h1 style="font-size:1.4rem;margin:0 0 0.5rem">${escapeHtml(post.headline)}</h1>
        <p>${escapeHtml(post.lede)}</p>
        <ol>${items}</ol>
        <p><a href="${escapeHtml(origin)}/ideas?post=${escapeHtml(post.id)}">Open this brief on Creek Street</a></p>
      </div>`;
  }

  private async callClaude(opts: {
    apiKey: string;
    model: string;
    focus: IdeaPillar | 'ALL';
    notes: string;
  }): Promise<ClaudeBrief> {
    const pillarBlurb = ideaPillars.map((p) => `${p.key}: ${p.blurb}`).join('\n');
    const system = [
      'You are a civic strategy aide for Creek Street Historic District in Ketchikan, Alaska.',
      'Propose practical ideas that (1) preserve culture, (2) build local business, and (3) drive City/Borough revenue.',
      'Respect Historic District design review, boardwalk constraints, material honesty, and cruise-season realities.',
      'Never claim to be official City or Borough policy. Never invent private records or legal conclusions.',
      'Return ONLY valid JSON matching the schema. No markdown fences.',
      'Pillars:',
      pillarBlurb,
    ].join('\n');

    const user = [
      `Focus: ${opts.focus}`,
      opts.notes ? `Operator notes: ${opts.notes}` : 'Operator notes: (none)',
      'Return JSON:',
      '{',
      '  "headline": string,',
      '  "lede": string,',
      '  "suggestions": [',
      '    { "pillar": "CULTURE"|"BUSINESS"|"REVENUE", "title": string, "summary": string, "whyItFits": string, "nextStep": string, "tags": string[] }',
      '  ],',
      '  "playbook": string[]',
      '}',
      'Provide 3 suggestions (or 3 within the focus pillar). Keep titles under 80 chars. Tags: 2-5 short slugs.',
    ].join('\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': opts.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: 1800,
        temperature: 0.7,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      this.log.error(`Claude API ${res.status}: ${detail.slice(0, 300)}`);
      throw new ServiceUnavailableException({
        error: 'ANTHROPIC_FAILED',
        message: `Claude request failed (${res.status}). Check ANTHROPIC_API_KEY and model.`,
      });
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
    return parseClaudeBrief(text, opts.focus);
  }
}

function normalizeFocus(raw?: string): IdeaPillar | 'ALL' {
  const v = (raw ?? 'ALL').toUpperCase();
  if (v === 'CULTURE' || v === 'BUSINESS' || v === 'REVENUE') return v;
  return 'ALL';
}

function parseClaudeBrief(text: string, focus: IdeaPillar | 'ALL'): ClaudeBrief {
  const jsonText = extractJson(text);
  let parsed: Partial<ClaudeBrief>;
  try {
    parsed = JSON.parse(jsonText) as Partial<ClaudeBrief>;
  } catch {
    throw new ServiceUnavailableException({
      error: 'ANTHROPIC_PARSE_FAILED',
      message: 'Claude returned unreadable JSON. Try again.',
    });
  }

  const suggestions = (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
    .map(normalizeSuggestion)
    .filter((s): s is AiSuggestion => s != null)
    .slice(0, 6);

  if (!suggestions.length) {
    throw new ServiceUnavailableException({
      error: 'ANTHROPIC_EMPTY',
      message: 'Claude returned no usable suggestions.',
    });
  }

  const filtered =
    focus === 'ALL' ? suggestions : suggestions.filter((s) => s.pillar === focus);
  const finalSuggestions = (filtered.length ? filtered : suggestions).slice(0, 3);

  return {
    headline: String(parsed.headline || 'Creek Street civic brief').slice(0, 160),
    lede: String(
      parsed.lede ||
        'AI-assisted ideas for culture, business, and public revenue on the boardwalk.',
    ).slice(0, 400),
    suggestions: finalSuggestions,
    playbook: (Array.isArray(parsed.playbook) ? parsed.playbook : [])
      .map((p) => String(p).slice(0, 240))
      .filter(Boolean)
      .slice(0, 6),
  };
}

function normalizeSuggestion(raw: unknown): AiSuggestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  const pillar = String(s.pillar || '').toUpperCase();
  if (pillar !== 'CULTURE' && pillar !== 'BUSINESS' && pillar !== 'REVENUE') return null;
  const title = String(s.title || '').trim();
  const summary = String(s.summary || '').trim();
  if (!title || !summary) return null;
  return {
    pillar,
    title: title.slice(0, 120),
    summary: summary.slice(0, 500),
    whyItFits: String(s.whyItFits || '').trim().slice(0, 400),
    nextStep: String(s.nextStep || '').trim().slice(0, 300),
    tags: (Array.isArray(s.tags) ? s.tags : [])
      .map((t) => String(t).toLowerCase().replace(/\s+/g, '-').slice(0, 32))
      .filter(Boolean)
      .slice(0, 6),
  };
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
