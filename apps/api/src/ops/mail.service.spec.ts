import { afterEach, describe, expect, it } from 'vitest';
import { MailService } from './mail.service';

describe('MailService', () => {
  afterEach(() => {
    delete process.env.SMTP_URL;
    delete process.env.SMTP_FROM;
  });

  it('stubs deliveries when SMTP_URL is unset', async () => {
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
});
