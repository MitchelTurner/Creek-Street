import { Injectable } from '@nestjs/common';
import { meetings } from '../data/phase0-seed';

/**
 * Phase 14 — public iCalendar feed of mirrored Design Review Board meetings.
 */
@Injectable()
export class IcalService {
  buildFeed(origin = 'https://creek-street.local') {
    const base = origin.replace(/\/$/, '');
    const now = formatIcalUtc(new Date());
    const events = meetings
      .slice()
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .map((m) => {
        const start = new Date(m.scheduledAt);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        const summary = `Creek Street Design Review Board (${m.status.replace(/_/g, ' ')})`;
        const description = [
          m.location,
          ...m.agendaItems.map((ai) => `${ai.itemNumber} ${ai.title}`),
          'Independent public mirror — Mitchel Turner Dev, LLC (not a borough property).',
          `Details: ${base}/meetings`,
          m.agendaUrl ? `Agenda: ${m.agendaUrl}` : null,
        ]
          .filter(Boolean)
          .join('\\n');

        return [
          'BEGIN:VEVENT',
          `UID:creek-street-${m.id}@creek-street.local`,
          `DTSTAMP:${now}`,
          `DTSTART:${formatIcalUtc(start)}`,
          `DTEND:${formatIcalUtc(end)}`,
          `SUMMARY:${escapeText(summary)}`,
          `DESCRIPTION:${escapeText(description)}`,
          `LOCATION:${escapeText(m.location)}`,
          `URL:${base}/meetings`,
          `STATUS:${m.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED'}`,
          'END:VEVENT',
        ].join('\r\n');
      });

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Mitchel Turner Dev LLC//Creek Street Design Review Hub//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Creek Street Design Review Board',
      'X-WR-TIMEZONE:America/Juneau',
      ...events,
      'END:VCALENDAR',
      '',
    ].join('\r\n');
  }
}

function formatIcalUtc(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeText(s: string) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
