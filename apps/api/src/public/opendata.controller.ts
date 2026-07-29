import { Controller, Get, Header, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MemoryStore } from '../store/memory.store';

@Controller('opendata')
export class OpenDataController {
  constructor(private readonly store: MemoryStore) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=300')
  index() {
    return {
      license: this.store.license(),
      meta: this.store.meta(),
      endpoints: {
        bundle: '/api/opendata/bundle.json',
        structures: '/api/opendata/structures.csv',
        applications: '/api/opendata/applications.csv',
        decisions: '/api/opendata/decisions.csv',
        meetings: '/api/opendata/meetings.csv',
        seats: '/api/opendata/seats.csv',
      },
      schema: {
        structures: ['id', 'publicSlug', 'addressLabel', 'commonName', 'yearBuilt', 'nrhpContributing', 'sourceDocUrl'],
        applications: ['id', 'caseNumber', 'projectType', 'status', 'filedAt', 'description', 'sourceDocUrl'],
        decisions: ['id', 'applicationId', 'recommendation', 'finalOutcome', 'decidedAt', 'sourceDocUrl'],
        meetings: ['id', 'scheduledAt', 'status', 'quorumMet', 'location'],
        seats: ['id', 'label', 'seatType', 'memberName', 'termStart', 'termEnd', 'isVacant'],
      },
    };
  }

  @Get('bundle.json')
  @Header('Cache-Control', 'public, max-age=300')
  bundle() {
    return this.store.openDataBundle();
  }

  @Get('structures.csv')
  structuresCsv(@Res() res: Response) {
    const rows = this.store.listStructures();
    const csv = toCsv(
      ['id', 'publicSlug', 'addressLabel', 'commonName', 'yearBuilt', 'nrhpContributing', 'sourceDocUrl'],
      rows.map((r) => [
        r.id,
        r.publicSlug,
        r.addressLabel,
        r.commonName ?? '',
        r.yearBuilt ?? '',
        r.nrhpContributing,
        r.sourceDocUrl,
      ]),
    );
    sendCsv(res, 'structures.csv', csv);
  }

  @Get('applications.csv')
  applicationsCsv(@Res() res: Response) {
    const rows = this.store.listApplications();
    const csv = toCsv(
      ['id', 'caseNumber', 'projectType', 'status', 'filedAt', 'description', 'sourceDocUrl'],
      rows.map((r) => [
        r.id,
        r.caseNumber ?? '',
        r.projectType,
        r.status,
        r.filedAt ?? '',
        r.description,
        r.sourceDocUrl ?? '',
      ]),
    );
    sendCsv(res, 'applications.csv', csv);
  }

  @Get('decisions.csv')
  decisionsCsv(@Res() res: Response) {
    const rows = this.store.listDecisions();
    const csv = toCsv(
      ['id', 'applicationId', 'recommendation', 'finalOutcome', 'decidedAt', 'sourceDocUrl'],
      rows.map((r) => [
        r.id,
        r.applicationId,
        r.recommendation,
        r.finalOutcome ?? '',
        r.decidedAt ?? '',
        r.sourceDocUrl,
      ]),
    );
    sendCsv(res, 'decisions.csv', csv);
  }

  @Get('meetings.csv')
  meetingsCsv(@Res() res: Response) {
    const rows = this.store.listMeetings();
    const csv = toCsv(
      ['id', 'scheduledAt', 'status', 'quorumMet', 'location'],
      rows.map((r) => [r.id, r.scheduledAt, r.status, r.quorumMet ?? '', r.location]),
    );
    sendCsv(res, 'meetings.csv', csv);
  }

  @Get('seats.csv')
  seatsCsv(@Res() res: Response) {
    const rows = this.store.listSeats();
    const csv = toCsv(
      ['id', 'label', 'seatType', 'memberName', 'termStart', 'termEnd', 'isVacant'],
      rows.map((r) => [
        r.id,
        r.label,
        r.seatType,
        r.currentTerm?.memberName ?? '',
        r.currentTerm?.termStart ?? '',
        r.currentTerm?.termEnd ?? '',
        r.isVacant,
      ]),
    );
    sendCsv(res, 'seats.csv', csv);
  }
}

function toCsv(headers: string[], rows: (string | number | boolean)[][]) {
  const esc = (v: string | number | boolean) => {
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [headers.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}

function sendCsv(res: Response, filename: string, body: string) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(body);
}
