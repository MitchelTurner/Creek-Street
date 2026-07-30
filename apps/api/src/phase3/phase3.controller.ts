import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuditStore } from '../compliance/audit.store';
import { AuthGuard, CurrentUser } from '../phase2/auth.guard';
import { Roles, RolesGuard } from '../phase2/roles.guard';
import { BoardStore } from './board.store';
import { ContractGate } from './contract.gate';
import { MeetingPrepService } from './meeting-prep.service';
import { Phase3Service } from './phase3.service';

type AuthedUser = { id: string; email: string; role: string };

@Controller('board')
@UseGuards(AuthGuard, RolesGuard)
export class Phase3Controller {
  constructor(
    private readonly phase3: Phase3Service,
    private readonly board: BoardStore,
    private readonly contract: ContractGate,
    private readonly prep: MeetingPrepService,
    private readonly audit: AuditStore,
  ) {}

  @Get('contract')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  @Header('Cache-Control', 'no-store')
  contractStatus() {
    return this.contract.status();
  }

  @Get('dashboard')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  dashboard() {
    return this.phase3.boardDashboard();
  }

  @Get('applications/:id')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  application(@Param('id') id: string) {
    const row = this.phase3.applicationBoardView(id);
    if (!row) throw new NotFoundException('Application not found');
    return row;
  }

  // ── Private member notes (always on for board; never shared) ──────────────

  @Get('notes')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  listNotes(@CurrentUser() user: AuthedUser, @Query('applicationId') applicationId?: string) {
    return {
      notes: this.board.listNotes(user.id, applicationId),
      isolation:
        'These notes are visible only to you. They are never shared with other members and are never attached to a decision record.',
    };
  }

  @Post('notes')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  createNote(
    @CurrentUser() user: AuthedUser,
    @Body() body: { applicationId?: string; body?: string },
  ) {
    if (!body.applicationId || !body.body?.trim()) {
      throw new BadRequestException('applicationId and body required');
    }
    return { note: this.board.createNote(user.id, body.applicationId, body.body.trim()) };
  }

  @Patch('notes/:id')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  updateNote(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() body: { body?: string },
  ) {
    if (!body.body?.trim()) throw new BadRequestException('body required');
    const note = this.board.updateNote(user.id, id, body.body.trim());
    if (!note) throw new NotFoundException('Note not found');
    return { note };
  }

  @Delete('notes/:id')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  deleteNote(@CurrentUser() user: AuthedUser, @Param('id') id: string) {
    return { ok: this.board.deleteNote(user.id, id) };
  }

  @Get('notes/export.json')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  exportNotes(@CurrentUser() user: AuthedUser) {
    return this.board.exportNotes(user.id);
  }

  // ── Meeting prep (public facts + own note counts; always available) ───────

  @Get('meetings/:id/prep')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  @Header('Cache-Control', 'no-store')
  meetingPrep(@CurrentUser() user: AuthedUser, @Param('id') id: string) {
    const row = this.prep.prep(id, user.id);
    if (!row) throw new NotFoundException('Meeting not found');
    return row;
  }

  @Get('meetings/:id/prep.pdf')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  async meetingPrepPdf(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const buf = await this.prep.buildPdf(id, user.id);
    if (!buf) throw new NotFoundException('Meeting not found');
    this.audit.record({
      action: 'board.meeting.prep_download',
      actor: user,
      resourceType: 'meeting',
      resourceId: id,
      summary: `Meeting prep PDF downloaded by ${user.email}`,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="creek-street-meeting-prep-${id}.pdf"`,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(buf);
  }

  // ── Contract-gated deliberation ───────────────────────────────────────────

  @Get('applications/:id/comments')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  listComments(@Param('id') id: string) {
    this.contract.assertActive();
    return { comments: this.board.listComments(id) };
  }

  @Post('applications/:id/comments')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  addComment(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() body: { body?: string },
  ) {
    this.contract.assertActive();
    if (!body.body?.trim()) throw new BadRequestException('body required');
    return {
      comment: this.board.addComment(user.id, id, body.body.trim()),
      omaWarning:
        'Circulated comments on pending applications must occur only under OMA-compliant noticed-meeting integration configured in the processor agreement.',
    };
  }

  @Get('applications/:id/scores')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  listScores(@Param('id') id: string) {
    this.contract.assertActive();
    return { scores: this.board.listScores(id) };
  }

  @Post('applications/:id/scores')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  score(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() body: { criterion?: string; score?: number; rationale?: string },
  ) {
    this.contract.assertActive();
    if (!body.criterion || body.score == null) {
      throw new BadRequestException('criterion and score required');
    }
    return {
      score: this.board.upsertScore(
        user.id,
        id,
        body.criterion,
        Number(body.score),
        body.rationale ?? '',
      ),
    };
  }

  @Get('applications/:id/findings')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  listFindings(@Param('id') id: string) {
    this.contract.assertActive();
    return { findings: this.board.listFindings(id) };
  }

  @Post('applications/:id/findings')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  finding(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() body: { body?: string; status?: 'DRAFT' | 'READY_FOR_PACKET' },
  ) {
    this.contract.assertActive();
    if (!body.body?.trim()) throw new BadRequestException('body required');
    return {
      finding: this.board.upsertFinding(
        user.id,
        id,
        body.body.trim(),
        body.status ?? 'DRAFT',
      ),
    };
  }

  @Get('applications/:id/recommendation')
  @Roles('BOARD_MEMBER', 'STAFF', 'ADMIN')
  recommendation(@Param('id') id: string) {
    this.contract.assertActive();
    return this.board.assembleRecommendation(id);
  }
}
