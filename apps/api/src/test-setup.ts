import { afterEach, beforeEach } from 'vitest';

function clearMailAndAiEnv() {
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM;
  delete process.env.SMTP_URL;
  delete process.env.SMTP_FROM;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.IDEA_NOTIFY_EMAILS;
  delete process.env.IDEA_AI_AUTO_NOTIFY;
}

/** Keep shared process.env mail/AI keys from leaking across parallel specs. */
beforeEach(clearMailAndAiEnv);
afterEach(clearMailAndAiEnv);
