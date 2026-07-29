import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type MailResult = {
  mode: 'smtp' | 'stub';
  accepted: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Phase 9 mail transport.
 * Uses nodemailer when SMTP_URL is set; otherwise logs a stub delivery.
 */
@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly log = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private mode: 'smtp' | 'stub' = 'stub';
  private sent = 0;
  private failed = 0;

  constructor() {
    const url = process.env.SMTP_URL?.trim();
    if (url) {
      try {
        this.transporter = nodemailer.createTransport(url);
        this.mode = 'smtp';
        this.log.log('SMTP transport configured');
      } catch (e) {
        this.mode = 'stub';
        this.log.error(`SMTP_URL invalid; falling back to stub. ${(e as Error).message}`);
      }
    } else {
      this.log.warn('SMTP_URL unset — email deliveries are stubbed to logs.');
    }
  }

  status() {
    return {
      mode: this.mode,
      from: process.env.SMTP_FROM ?? 'noreply@creek-street.local',
      sent: this.sent,
      failed: this.failed,
    };
  }

  async send(payload: MailPayload): Promise<MailResult> {
    const from = process.env.SMTP_FROM ?? 'Creek Street Hub <noreply@creek-street.local>';
    if (this.mode === 'smtp' && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          html: payload.html ?? `<p>${escapeHtml(payload.text)}</p>`,
        });
        this.sent += 1;
        return { mode: 'smtp', accepted: true, messageId: info.messageId };
      } catch (e) {
        this.failed += 1;
        this.log.error(`SMTP send failed to=${payload.to}: ${(e as Error).message}`);
        return { mode: 'smtp', accepted: false, error: (e as Error).message };
      }
    }

    this.sent += 1;
    this.log.log(`[email-stub] to=${payload.to} subject="${payload.subject}"`);
    return { mode: 'stub', accepted: true, messageId: `stub-${this.sent}` };
  }

  async onModuleDestroy() {
    if (this.transporter && 'close' in this.transporter) {
      this.transporter.close();
    }
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
