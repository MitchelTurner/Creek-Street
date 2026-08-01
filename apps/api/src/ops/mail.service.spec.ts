import { afterEach, describe, expect, it, vi } from 'vitest';
import { MailService } from './mail.service';

describe('MailService', () => {
  afterEach(() => {
    delete process.env.SMTP_URL;
    delete process.env.SMTP_FROM;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
    vi.unstubAllGlobals();
  });

  it('stubs deliveries when RESEND_API_KEY and SMTP_URL are unset', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_URL;
    const mail = new MailService();
    const result = await mail.send({
      to: 'neighbor@example.com',
      subject: 'Test',
      text: 'Hello from Creek Street',
    });
    expect(result.mode).toBe('stub');
    expect(result.accepted).toBe(true);
    expect(mail.status().mode).toBe('stub');
    expect(mail.status().sent).toBe(1);
  });

  it('sends via Resend when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.RESEND_FROM = 'Creek Street Hub <hub@example.com>';
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ id: 'email_123' }),
        }),
      );

      const mail = new MailService();
      expect(mail.status().mode).toBe('resend');
      const result = await mail.send({
        to: 'ops@example.com',
        subject: 'Idea brief',
        text: 'Body',
      });
      expect(result.mode).toBe('resend');
      expect(result.accepted).toBe(true);
      expect(result.messageId).toBe('email_123');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({ method: 'POST' }),
      );
    } finally {
      delete process.env.RESEND_API_KEY;
      delete process.env.RESEND_FROM;
    }
  });
});
