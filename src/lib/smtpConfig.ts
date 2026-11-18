import type { EmailConfig } from '@/lib/email';
import { isValidEmail } from '@/utils/validation';

/**
 * SMTP credentials come from the server environment only.
 *
 * They must never be read from or written to Firestore: `siteContent` is
 * world-readable, so anything stored there is shipped to every visitor.
 */
export function getSmtpConfig(): EmailConfig | null {
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const appPassword = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const recipientEmail = (process.env.CONTACT_RECEIVER_EMAIL || smtpUser).trim();

  if (!smtpUser || !appPassword || !recipientEmail) return null;
  if (!isValidEmail(smtpUser) || !isValidEmail(recipientEmail)) return null;

  return { smtpUser, appPassword, recipientEmail };
}

/** Safe, secret-free status for the admin UI. */
export function getSmtpStatus(): {
  configured: boolean;
  smtpUser: string;
  receiverEmail: string;
} {
  const config = getSmtpConfig();
  return {
    configured: config !== null,
    smtpUser: config?.smtpUser ?? '',
    receiverEmail: config?.recipientEmail ?? '',
  };
}
