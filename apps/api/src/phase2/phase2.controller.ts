import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AuditStore } from '../compliance/audit.store';
import { applications } from '../data/phase0-seed';
import {
  AuthRateLimitGuard,
  PhotoRateLimitGuard,
  SubscriptionRateLimitGuard,
} from '../ops/rate-limit';
import { ApplicantStore } from './applicant.store';
import { AuthGuard, CurrentUser } from './auth.guard';
import { Phase2Service } from './phase2.service';

type AuthedUser = { id: string; email: string; role: string };

@Controller()
export class Phase2Controller {
  constructor(
    private readonly store: ApplicantStore,
    private readonly phase2: Phase2Service,
    private readonly audit: AuditStore,
  ) {}

  @Get('phase2/disclaimer')
  @Header('Cache-Control', 'public, max-age=600')
  disclaimer() {
    return this.phase2.disclaimer();
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  @Post('auth/register')
  @UseGuards(AuthRateLimitGuard)
  async register(@Body() body: { email?: string; password?: string }) {
    if (!body.email || !body.password || body.password.length < 8) {
      throw new BadRequestException('Email and password (8+ chars) required');
    }
    try {
      const user = await this.store.register(body.email, body.password);
      const session = await this.store.login(body.email, body.password);
      return { ...session, disclaimer: this.phase2.disclaimer() };
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  @Post('auth/login')
  @UseGuards(AuthRateLimitGuard)
  async login(@Body() body: { email?: string; password?: string }) {
    if (!body.email || !body.password) throw new BadRequestException('Email and password required');
    const session = await this.store.login(body.email, body.password);
    if (!session) throw new BadRequestException('Invalid credentials');
    return { ...session, disclaimer: this.phase2.disclaimer() };
  }

  @Post('auth/logout')
  logout(@Headers('authorization') authorization?: string) {
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    if (token) this.store.logout(token);
    return { ok: true };
  }

  @Get('auth/me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthedUser) {
    return { user, disclaimer: this.phase2.disclaimer() };
  }

  @Get('applicant/export')
  @UseGuards(AuthGuard)
  @Header('Cache-Control', 'no-store')
  exportAccount(@CurrentUser() user: AuthedUser) {
    const pack = this.store.exportAccount(user.id);
    if (!pack) throw new NotFoundException('Account not found');
    this.audit.record({
      action: 'applicant.export',
      actor: user,
      resourceType: 'user',
      resourceId: user.id,
      summary: `Applicant exported account data (${user.email})`,
    });
    return pack;
  }

  @Delete('applicant/account')
  @UseGuards(AuthGuard)
  deleteAccount(@CurrentUser() user: AuthedUser, @Headers('authorization') authorization?: string) {
    const result = this.store.deleteAccount(user.id);
    if (!result.ok) throw new BadRequestException(result.reason);
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    if (token) this.store.logout(token);
    this.audit.record({
      action: 'applicant.delete',
      actor: { id: user.id, email: user.email, role: user.role },
      resourceType: 'user',
      resourceId: user.id,
      summary: `Applicant deleted account (${result.email}); drafts=${result.deletedDrafts}`,
    });
    return result;
  }

  // ── Applicant drafts ──────────────────────────────────────────────────────

  @Get('applicant/drafts')
  @UseGuards(AuthGuard)
  listDrafts(@CurrentUser() user: AuthedUser) {
    return {
      drafts: this.store.listDrafts(user.id),
      disclaimer: this.phase2.disclaimer(),
    };
  }

  @Post('applicant/drafts')
  @UseGuards(AuthGuard)
  createDraft(
    @CurrentUser() user: AuthedUser,
    @Body()
    body: {
      projectType: string;
      description?: string;
      applicantName?: string;
      parcelId?: string;
      structureId?: string;
    },
  ) {
    if (!body.projectType) throw new BadRequestException('projectType required');
    return {
      draft: this.store.createDraft(user.id, body),
      disclaimer: this.phase2.disclaimer(),
    };
  }

  @Get('applicant/drafts/:id')
  @UseGuards(AuthGuard)
  getDraft(@CurrentUser() user: AuthedUser, @Param('id') id: string) {
    const draft = this.store.getDraft(user.id, id);
    if (!draft) throw new NotFoundException('Draft not found');
    const docketMatch = draft.linkedCaseNumber
      ? applications.find((a) => a.caseNumber === draft.linkedCaseNumber) ?? null
      : null;
    return { draft, docketMatch, disclaimer: this.phase2.disclaimer() };
  }

  @Patch('applicant/drafts/:id')
  @UseGuards(AuthGuard)
  updateDraft(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const draft = this.store.updateDraft(user.id, id, body as never);
    if (!draft) throw new NotFoundException('Draft not found');
    return { draft, disclaimer: this.phase2.disclaimer() };
  }

  @Post('applicant/drafts/:id/documents')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadDoc(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() body: { kind?: string },
    @UploadedFile() file?: { originalname: string; buffer: Buffer },
  ) {
    if (!file?.buffer) throw new BadRequestException('file required');
    if (!body.kind) throw new BadRequestException('kind required');
    const draft = this.store.addDocument(user.id, id, {
      kind: body.kind,
      fileName: file.originalname,
      buffer: file.buffer,
    });
    if (!draft) throw new NotFoundException('Draft not found');
    return { draft, disclaimer: this.phase2.disclaimer() };
  }

  @Get('applicant/drafts/:id/package.pdf')
  @UseGuards(AuthGuard)
  async packagePdf(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const result = await this.phase2.buildDraftPdf(user.id, id);
    if (!result) throw new NotFoundException('Draft not found');
    if (!result.draft.completeness.complete) {
      // Still allow download, but filename marks incomplete
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="creek-street-preapp-${id.slice(0, 8)}.pdf"`,
    );
    res.send(result.buffer);
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  @Post('subscriptions')
  @UseGuards(SubscriptionRateLimitGuard)
  createSubscription(
    @Body()
    body: {
      email?: string;
      scope?: 'PARCEL' | 'RADIUS' | 'PROJECT_TYPE' | 'DISTRICT_WIDE';
      parcelId?: string;
      radiusMeters?: number;
      centerLng?: number;
      centerLat?: number;
      projectTypes?: string[];
      channel?: 'EMAIL' | 'RSS';
      token?: string;
    },
    @Headers('authorization') authorization?: string,
  ) {
    if (!body.email || !body.scope) throw new BadRequestException('email and scope required');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : body.token;
    const user = this.store.userFromToken(token);
    const row = this.store.createSubscription({
      userId: user?.id ?? null,
      email: body.email,
      scope: body.scope,
      parcelId: body.parcelId ?? null,
      centerPoint:
        body.centerLng != null && body.centerLat != null
          ? { type: 'Point', coordinates: [body.centerLng, body.centerLat] }
          : null,
      radiusMeters: body.radiusMeters ?? null,
      projectTypes: body.projectTypes ?? [],
      channel: body.channel ?? 'EMAIL',
    });
    return {
      subscription: {
        id: row.id,
        email: row.email,
        scope: row.scope,
        channel: row.channel,
        unsubToken: row.unsubToken,
        rssPath: row.channel === 'RSS' ? `/api/subscriptions/rss/${row.unsubToken}.xml` : null,
      },
      disclaimer: this.phase2.disclaimer(),
    };
  }

  @Get('subscriptions/mine')
  @UseGuards(AuthGuard)
  mySubscriptions(@CurrentUser() user: AuthedUser) {
    return { subscriptions: this.store.listSubscriptions(user.id) };
  }

  @Post('subscriptions/unsubscribe')
  unsubscribe(@Body() body: { token?: string }) {
    if (!body.token) throw new BadRequestException('token required');
    return { ok: this.store.unsubscribe(body.token) };
  }

  @Get('subscriptions/rss/:token.xml')
  @Header('Content-Type', 'application/rss+xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=300')
  rss(@Param('token') token: string) {
    const sub = this.store.rssFeed().find((s) => s.unsubToken === token);
    if (!sub) throw new NotFoundException('Feed not found');
    // DRAFT never appears — public statuses only.
    const items = applications
      .filter((a) =>
        ['FILED', 'SCHEDULED', 'BOARD_REVIEWED', 'FORWARDED', 'APPROVED', 'APPROVED_W_CONDITIONS', 'DENIED'].includes(
          a.status,
        ),
      )
      .slice(0, 25);
    const built = new Date().toUTCString();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>Creek Street Design Review — ${escapeXml(sub.scope)}</title>
<link>https://creek-street.local/docket</link>
<atom:link href="https://creek-street.local/api/subscriptions/rss/${escapeXml(token)}.xml" rel="self" type="application/rss+xml"/>
<description>Subscription feed for HD zone applications. Independent hub operated by Mitchel Turner Dev, LLC — not a borough property. Verify against borough records before filing.</description>
<language>en-us</language>
<lastBuildDate>${built}</lastBuildDate>
<ttl>60</ttl>
${items
  .map(
    (a) => `<item>
<title>${escapeXml(a.caseNumber ?? a.id)} — ${escapeXml(a.status)}</title>
<link>https://creek-street.local/docket/${escapeXml(a.id)}</link>
<description>${escapeXml(a.description)}</description>
<guid isPermaLink="false">${escapeXml(a.id)}</guid>
<category>${escapeXml(a.status)}</category>
</item>`,
  )
  .join('\n')}
</channel></rss>`;
    return xml;
  }

  // ── Notice + timeline (public) ────────────────────────────────────────────

  @Get('notice')
  @Header('Cache-Control', 'public, max-age=120')
  notice(
    @Query('address') address?: string,
    @Query('parcelId') parcelId?: string,
    @Query('applicationId') applicationId?: string,
  ) {
    return this.phase2.noticeLookup({ address, parcelId, applicationId });
  }

  @Get('notice/config')
  @Header('Cache-Control', 'public, max-age=600')
  noticeConfig() {
    return this.phase2.noticeConfig();
  }

  @Get('timelines')
  @Header('Cache-Control', 'public, max-age=300')
  timelines() {
    return this.phase2.timelineExpectations();
  }

  // ── Photo crowdsourcing ───────────────────────────────────────────────────

  @Post('photos/submit')
  @UseGuards(PhotoRateLimitGuard)
  @UseInterceptors(FileInterceptor('file'))
  submitPhoto(
    @Body()
    body: {
      structureId?: string;
      caption?: string;
      credit?: string;
      yearApprox?: string;
      email?: string;
    },
    @UploadedFile() file?: { originalname: string; buffer: Buffer },
    @Headers('authorization') authorization?: string,
  ) {
    if (!body.structureId || !body.email || !file?.buffer) {
      throw new BadRequestException('structureId, email, and file required');
    }
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    const user = this.store.userFromToken(token);
    const photo = this.store.submitPhoto({
      structureId: body.structureId,
      caption: body.caption ?? '',
      credit: body.credit ?? body.email,
      yearApprox: body.yearApprox ? Number(body.yearApprox) : null,
      submittedByUserId: user?.id ?? null,
      submitterEmail: body.email,
      buffer: file.buffer,
      fileName: file.originalname,
    });
    return {
      photo: { id: photo.id, moderationStatus: photo.moderationStatus },
      note: 'Submission queued for moderation. Approved photos join the structure time-series.',
      disclaimer: this.phase2.disclaimer(),
    };
  }

  @Get('photos/pending')
  @UseGuards(AuthGuard)
  pendingPhotos(@CurrentUser() user: AuthedUser) {
    if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
      // Demo: allow any authed user to see queue label, but empty unless staff
      return { photos: [], note: 'Moderation queue is staff-only.' };
    }
    return { photos: this.store.listPendingPhotos() };
  }

  @Post('photos/:id/moderate')
  @UseGuards(AuthGuard)
  moderate(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() body: { status?: 'APPROVED' | 'REJECTED' },
  ) {
    if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
      throw new BadRequestException('Staff only');
    }
    if (!body.status) throw new BadRequestException('status required');
    const photo = this.store.moderatePhoto(id, body.status, user.email);
    if (!photo) throw new NotFoundException('Photo not found');
    this.audit.record({
      action: 'photo.moderate',
      actor: user,
      resourceType: 'photo',
      resourceId: id,
      summary: `Photo ${body.status.toLowerCase()} by ${user.email}`,
      meta: { status: body.status },
    });
    return { photo };
  }

  @Get('photos/approved')
  approved(@Query('structureId') structureId?: string) {
    return { photos: this.store.listApprovedPhotos(structureId) };
  }
}

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
