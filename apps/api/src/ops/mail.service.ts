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
  mode: 'resend' | 'smtp' | 'stub';
  accepted: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Mail transport.
 * Preference checked at send time: RESEND_API_KEY → SMTP_URL → stub log.
 */
@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly log = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private smtpInitAttempted = false;
  private sent = 0;
  private failed = 0;

  constructor() {
    // Lazy-init SMTP on first smtp send so tests can toggle env safely.
    if (!process.env.RESEND_API_KEY?.trim() && !process.env.SMTP_URL?.trim()) {
      this.log.warn('RESEND_API_KEY and SMTP_URL unset — email deliveries are stubbed to logs.');
    }
  }

  status() {
    const mode = this.currentMode();
    return {
      mode,
      from: this.fromAddress(),
      sent: this.sent,
      failed: this.failed,
      resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
      smtpConfigured: Boolean(process.env.SMTP_URL?.trim()),
    };
  }

  async send(payload: MailPayload): Promise<MailResult> {
    const from = this.fromAddress();
    const html = payload.html ?? `<p>${escapeHtml(payload.text)}</p>`;
    const mode = this.currentMode();

    if (mode === 'resend') {
      return this.sendResend({ ...payload, from, html });
    }

    if (mode === 'smtp') {
      const transporter = this.ensureSmtp();
      if (!transporter) {
        this.failed += 1;
        return { mode: 'smtp', accepted: false, error: 'SMTP transport unavailable' };
      }
      try {
        const info = await transporter.sendMail({
          from,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          html,
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

  private currentMode(): 'resend' | 'smtp' | 'stub' {
    if (process.env.RESEND_API_KEY?.trim()) return 'resend';
    if (process.env.SMTP_URL?.trim()) return 'smtp';
    return 'stub';
  }

  private fromAddress() {
    return (
      process.env.RESEND_FROM?.trim() ||
      process.env.SMTP_FROM?.trim() ||
      'Creek Street Hub <noreply@creek-street.local>'
    );
  }

  private ensureSmtp(): Transporter | null {
    if (this.transporter) return this.transporter;
    if (this.smtpInitAttempted) return null;
    this.smtpInitAttempted = true;
    const url = process.env.SMTP_URL?.trim();
    if (!url) return null;
    try {
      this.transporter = nodemailer.createTransport(url);
      this.log.log('SMTP transport configured');
      return this.transporter;
    } catch (e) {
      this.log.error(`SMTP_URL invalid; ${(e as Error).message}`);
      return null;
    }
  }

  private async sendResend(payload: MailPayload & { from: string; html: string }): Promise<MailResult> {
    const key = process.env.RESEND_API_KEY!.trim();
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: payload.from,
          to: [payload.to],
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        this.failed += 1;
        this.log.error(`Resend send failed to=${payload.to} status=${res.status}: ${detail.slice(0, 200)}`);
        return { mode: 'resend', accepted: false, error: `Resend ${res.status}` };
      }
      const data = (await res.json()) as { id?: string };
      this.sent += 1;
      return { mode: 'resend', accepted: true, messageId: data.id };
    } catch (e) {
      this.failed += 1;
      this.log.error(`Resend send failed to=${payload.to}: ${(e as Error).message}`);
      return { mode: 'resend', accepted: false, error: (e as Error).message };
    }
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
