import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import {
  JOURNAL_DISCLAIMER,
  JOURNAL_SEED_VERSION,
  journalTopics,
  type JournalEmbed,
  type JournalTopic,
} from '../data/journal-seed';
import { MailService } from '../ops/mail.service';
import { ApplicantStore } from '../phase2/applicant.store';

export type JournalPost = {
  id: string;
  slug: string;
  title: string;
  lede: string;
  body: string[];
  place: string;
  region: string;
  pillars: Array<'CULTURE' | 'BUSINESS' | 'REVENUE'>;
  tags: string[];
  takeaways: string[];
  embeds: JournalEmbed[];
  topicId: string;
  publishedAt: string;
  publishDateAlaska: string;
  source: 'curated' | 'claude';
  model: string | null;
  creekStreetHook: string;
  seedVersion: number;
};

export type WeeklyDigestResult = {
  at: string;
  weekKey: string;
  recipients: number;
  mode: string;
  accepted: number;
  failed: number;
  postCount: number;
  subject: string;
};

type StoreFile = {
  posts: JournalPost[];
  lastWeeklyWeekKey: string | null;
  seedVersion?: number;
};

@Injectable()
export class JournalService implements OnModuleInit {
  private readonly log = new Logger(JournalService.name);
  private posts: JournalPost[] = [];
  private lastWeeklyWeekKey: string | null = null;
  private lastWeekly: WeeklyDigestResult | null = null;
  private readonly storePath =
    process.env.JOURNAL_STORE_PATH?.trim() ||
    join(process.cwd(), 'data', 'journal-posts.json');

  constructor(
    private readonly mail: MailService,
    private readonly applicants: ApplicantStore,
  ) {}

  onModuleInit() {
    const loadedVersion = this.load();
    const needsRefresh =
      !this.posts.length ||
      loadedVersion !== JOURNAL_SEED_VERSION ||
      this.posts.some((p) => (p.seedVersion ?? 1) !== JOURNAL_SEED_VERSION);
    if (needsRefresh) {
      this.bootstrapSeedPosts();
      this.persist();
    }
    this.log.log(
      `Journal loaded posts=${this.posts.length} seed=v${JOURNAL_SEED_VERSION} store=${this.storePath}`,
    );
  }

  status() {
    return {
      phase: 35,
      postCount: this.posts.length,
      topicCount: journalTopics.length,
      claudeConfigured: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-20250514',
      mail: this.mail.status(),
      notifyRecipients: this.resolveRecipients().length,
      lastPublishedAlaska: this.posts[0]?.publishDateAlaska ?? null,
      lastWeeklyWeekKey: this.lastWeeklyWeekKey,
      lastWeekly: this.lastWeekly,
      storePath: this.storePath,
      disclaimer: JOURNAL_DISCLAIMER,
    };
  }

  list(limit = 30) {
    const n = Math.min(Math.max(limit, 1), 100);
    return {
      count: this.posts.length,
      posts: this.posts.slice(0, n).map((p) => this.card(p)),
      disclaimer: JOURNAL_DISCLAIMER,
    };
  }

  getBySlug(slug: string) {
    const post = this.posts.find((p) => p.slug === slug);
    if (!post) throw new NotFoundException('Journal post not found');
    return {
      ...post,
      embeds: photoEmbedsOnly(post.embeds),
      disclaimer: JOURNAL_DISCLAIMER,
    };
  }

  topics() {
    return {
      count: journalTopics.length,
      topics: journalTopics.map((t) => ({
        id: t.id,
        place: t.place,
        region: t.region,
        title: t.title,
        pillars: t.pillars,
        tags: t.tags,
        embedCount: t.embeds.length,
      })),
    };
  }

  /** Ensure today's Alaska-dated post exists; returns existing or newly published. */
  async ensureDailyPost(opts?: { force?: boolean; origin?: string }) {
    const today = alaskaDateKey(new Date());
    const existing = this.posts.find((p) => p.publishDateAlaska === today);
    if (existing && !opts?.force) {
      return { created: false, post: this.card(existing) };
    }

    const used = new Set(this.posts.map((p) => p.topicId));
    const topic =
      journalTopics.find((t) => !used.has(t.id)) ||
      journalTopics[this.posts.length % journalTopics.length]!;

    const post = await this.composePost(topic, today);
    if (existing && opts?.force) {
      this.posts = this.posts.filter((p) => p.id !== existing.id);
    }
    this.posts.unshift(post);
    this.posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    this.persist();
    this.log.log(`Journal published slug=${post.slug} source=${post.source}`);
    return { created: true, post: this.card(post) };
  }

  async sendWeeklyHighlights(opts?: { force?: boolean; origin?: string }) {
    const weekKey = alaskaWeekKey(new Date());
    if (!opts?.force && this.lastWeeklyWeekKey === weekKey) {
      return {
        skipped: true,
        reason: 'ALREADY_SENT_THIS_WEEK' as const,
        weekKey,
        last: this.lastWeekly,
      };
    }

    const since = Date.now() - 8 * 24 * 3600_000;
    const recent = this.posts.filter((p) => new Date(p.publishedAt).getTime() >= since).slice(0, 7);
    if (!recent.length) {
      throw new ServiceUnavailableException({
        error: 'NO_JOURNAL_POSTS',
        message: 'No journal posts available for weekly highlights.',
      });
    }

    const recipients = this.resolveRecipients();
    if (!recipients.length) {
      throw new ServiceUnavailableException({
        error: 'NO_NOTIFY_RECIPIENTS',
        message: 'Set JOURNAL_NOTIFY_EMAILS or IDEA_NOTIFY_EMAILS for weekly journal highlights.',
      });
    }

    const origin = (opts?.origin || process.env.PUBLIC_WEB_ORIGIN || 'https://creek-street.local').replace(
      /\/$/,
      '',
    );
    const subject = `Creek Street Journal — weekly highlights (${recent.length} posts)`;
    const text = this.buildWeeklyText(recent, origin);
    const html = this.buildWeeklyHtml(recent, origin);

    let accepted = 0;
    let failed = 0;
    for (const to of recipients) {
      const r = await this.mail.send({ to, subject, text, html });
      if (r.accepted) accepted += 1;
      else failed += 1;
    }

    this.lastWeeklyWeekKey = weekKey;
    this.lastWeekly = {
      at: new Date().toISOString(),
      weekKey,
      recipients: recipients.length,
      mode: this.mail.status().mode,
      accepted,
      failed,
      postCount: recent.length,
      subject,
    };
    this.persist();
    this.log.log(
      `Journal weekly digest week=${weekKey} recipients=${recipients.length} accepted=${accepted}`,
    );
    return { skipped: false, ...this.lastWeekly };
  }

  /** Test helpers */
  __resetForTest() {
    this.posts = [];
    this.lastWeeklyWeekKey = null;
    this.lastWeekly = null;
  }

  __setPostsForTest(posts: JournalPost[]) {
    this.posts = posts;
  }

  private card(post: JournalPost) {
    const photos = photoEmbedsOnly(post.embeds);
    const hero = photos[0];
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      lede: post.lede,
      place: post.place,
      region: post.region,
      pillars: post.pillars,
      tags: post.tags,
      publishedAt: post.publishedAt,
      publishDateAlaska: post.publishDateAlaska,
      source: post.source,
      heroEmbed: hero
        ? {
            imageUrl: hero.imageUrl,
            caption: hero.caption,
            sourceUrl: hero.sourceUrl,
            sourceTitle: hero.sourceTitle,
            credit: hero.credit,
            kind: 'photo' as const,
          }
        : null,
      embedCount: photos.length,
      href: `/journal/${post.slug}`,
    };
  }

  private async composePost(topic: JournalTopic, alaskaDate: string): Promise<JournalPost> {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (apiKey) {
      try {
        return await this.composeWithClaude(topic, alaskaDate, apiKey);
      } catch (e) {
        this.log.warn(`Claude journal compose failed; curated fallback. ${(e as Error).message}`);
      }
    }
    return this.composeCurated(topic, alaskaDate);
  }

  private composeCurated(topic: JournalTopic, alaskaDate: string): JournalPost {
    const slug = `${alaskaDate}-${topic.id}`.slice(0, 80);
    const body = [
      topic.hook,
      ...topic.scenes,
      topic.angle,
      `Creek Street doesn’t need a costume change to borrow from ${topic.place}. It needs one transferable tool that survives HD review, boardwalk capacity, and the cruise clock.`,
      'The photos below are embedded from the source articles — click through for the full story and licensing. We don’t host the images.',
    ];
    return {
      id: `journal_${alaskaDate}_${topic.id}`,
      slug,
      title: topic.title,
      lede: topic.hook,
      body,
      place: topic.place,
      region: topic.region,
      pillars: topic.pillars,
      tags: topic.tags,
      takeaways: topic.takeaways,
      embeds: photoEmbedsOnly(topic.embeds),
      topicId: topic.id,
      publishedAt: alaskaNoonIso(alaskaDate),
      publishDateAlaska: alaskaDate,
      source: 'curated',
      model: null,
      creekStreetHook: topic.creekStreetHook,
      seedVersion: JOURNAL_SEED_VERSION,
    };
  }

  private async composeWithClaude(
    topic: JournalTopic,
    alaskaDate: string,
    apiKey: string,
  ): Promise<JournalPost> {
    const model = process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-20250514';
    const system = [
      'You write vivid case-study journal posts for the Creek Street Historic District hub in Ketchikan, Alaska.',
      'Voice: specific, sensory, a little salty — like a sharp municipal reporter, not a tourism brochure.',
      'Open with a cold hook. Use concrete street-level detail. Avoid generic “charming historic” filler.',
      'Audience: city/borough staff, board members, applicants, civic entrepreneurs.',
      'Never claim to be official City or Borough policy. Never invent photo URLs.',
      'Return ONLY valid JSON.',
    ].join(' ');

    const user = [
      `Peer place: ${topic.place} (${topic.region})`,
      `Seed title: ${topic.title}`,
      `Hook: ${topic.hook}`,
      `Angle: ${topic.angle}`,
      `Scenes: ${topic.scenes.join(' / ')}`,
      `Takeaways: ${topic.takeaways.join(' | ')}`,
      `Creek Street hook: ${topic.creekStreetHook}`,
      `Pillars: ${topic.pillars.join(', ')}`,
      `Photo captions available: ${topic.embeds
        .filter((e) => e.kind === 'photo')
        .map((e) => e.caption)
        .join(' | ')}`,
      'Return JSON:',
      '{',
      '  "title": string,',
      '  "lede": string,',
      '  "body": string[],',
      '  "creekStreetHook": string,',
      '  "takeaways": string[]',
      '}',
      'body: 4-6 short paragraphs with character. takeaways: 3 punchy bullets. title under 90 chars. lede under 180 chars.',
    ].join('\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1600,
        temperature: 0.65,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Claude ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
    const parsed = JSON.parse(extractJson(text)) as {
      title?: string;
      lede?: string;
      body?: string[];
      creekStreetHook?: string;
      takeaways?: string[];
    };

    const base = this.composeCurated(topic, alaskaDate);
    return {
      ...base,
      title: String(parsed.title || topic.title).slice(0, 120),
      lede: String(parsed.lede || base.lede).slice(0, 220),
      body: (Array.isArray(parsed.body) ? parsed.body : base.body)
        .map((p) => String(p).slice(0, 900))
        .filter(Boolean)
        .slice(0, 7),
      takeaways: (Array.isArray(parsed.takeaways) ? parsed.takeaways : topic.takeaways)
        .map((t) => String(t).slice(0, 240))
        .filter(Boolean)
        .slice(0, 5),
      creekStreetHook: String(parsed.creekStreetHook || base.creekStreetHook).slice(0, 320),
      source: 'claude',
      model,
      // Photo embeds only — never invent remote media URLs or text-only cards.
      embeds: photoEmbedsOnly(topic.embeds),
      seedVersion: JOURNAL_SEED_VERSION,
    };
  }

  private resolveRecipients(): string[] {
    const raw =
      process.env.JOURNAL_NOTIFY_EMAILS?.trim() || process.env.IDEA_NOTIFY_EMAILS?.trim() || '';
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

  private buildWeeklyText(posts: JournalPost[], origin: string) {
    return [
      'Creek Street Journal — weekly highlights',
      '',
      JOURNAL_DISCLAIMER,
      '',
      ...posts.flatMap((p, i) => [
        `${i + 1}. ${p.title}`,
        `   ${p.place} · ${p.publishDateAlaska}`,
        `   ${p.lede}`,
        `   ${origin}/journal/${p.slug}`,
        '',
      ]),
      `Browse all: ${origin}/journal`,
    ].join('\n');
  }

  private buildWeeklyHtml(posts: JournalPost[], origin: string) {
    const items = posts
      .map((p) => {
        const img = p.embeds.find((e) => e.imageUrl)?.imageUrl;
        const thumb = img
          ? `<a href="${esc(origin)}/journal/${esc(p.slug)}"><img src="${esc(img)}" alt="" width="560" style="max-width:100%;height:auto;border-radius:4px" /></a>`
          : '';
        return `<li style="margin-bottom:1.25rem">
          ${thumb}
          <div style="margin-top:0.5rem"><a href="${esc(origin)}/journal/${esc(p.slug)}"><strong>${esc(p.title)}</strong></a></div>
          <div style="color:#556;font-size:0.9rem">${esc(p.place)} · ${esc(p.publishDateAlaska)}</div>
          <div style="margin-top:0.35rem">${esc(p.lede)}</div>
        </li>`;
      })
      .join('');
    return `<div style="font-family:Georgia,serif;color:#071312;max-width:640px;line-height:1.5">
      <p style="font-size:0.85rem;color:#666">${esc(JOURNAL_DISCLAIMER)}</p>
      <h1 style="font-size:1.35rem">Creek Street Journal — weekly highlights</h1>
      <ol>${items}</ol>
      <p><a href="${esc(origin)}/journal">Open the journal</a></p>
    </div>`;
  }

  private bootstrapSeedPosts() {
    this.posts = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const key = alaskaDateKey(d);
      const topic = journalTopics[i % journalTopics.length]!;
      const post = this.composeCurated(topic, key);
      post.id = `journal_seed_${key}_${topic.id}`;
      post.slug = `${key}-${topic.id}`;
      this.posts.push(post);
    }
    this.posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

  private load(): number | null {
    try {
      if (!existsSync(this.storePath)) return null;
      const raw = JSON.parse(readFileSync(this.storePath, 'utf8')) as StoreFile;
      if (Array.isArray(raw.posts)) this.posts = raw.posts;
      this.lastWeeklyWeekKey = raw.lastWeeklyWeekKey ?? null;
      return raw.seedVersion ?? 1;
    } catch (e) {
      this.log.warn(`Journal store load failed: ${(e as Error).message}`);
      return null;
    }
  }

  private persist() {
    try {
      mkdirSync(dirname(this.storePath), { recursive: true });
      const payload: StoreFile = {
        posts: this.posts.slice(0, 200),
        lastWeeklyWeekKey: this.lastWeeklyWeekKey,
        seedVersion: JOURNAL_SEED_VERSION,
      };
      writeFileSync(this.storePath, JSON.stringify(payload, null, 2));
    } catch (e) {
      this.log.warn(`Journal store persist failed: ${(e as Error).message}`);
    }
  }
}

function photoEmbedsOnly(embeds: JournalEmbed[]): JournalEmbed[] {
  return embeds.filter((e) => e.kind === 'photo' && Boolean(e.imageUrl?.trim()));
}

function alaskaDateKey(d: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Juneau',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function alaskaWeekKey(d: Date) {
  // Approximate ISO week in Alaska calendar date space
  const key = alaskaDateKey(d);
  const [y, m, day] = key.split('-').map(Number);
  const utc = new Date(Date.UTC(y!, m! - 1, day!));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function alaskaNoonIso(alaskaDate: string) {
  // Store a stable timestamp; display uses publishDateAlaska.
  return `${alaskaDate}T20:00:00.000Z`;
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
