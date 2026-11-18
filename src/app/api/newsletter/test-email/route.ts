import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/email';
import { getVerifiedAdminEmail } from '@/lib/adminAuth';
import { getSmtpConfig } from '@/lib/smtpConfig';
import { rateLimit, getClientIp } from '@/utils/rateLimit';

/**
 * Sends a test email using the server-side SMTP configuration.
 *
 * The client never supplies credentials and nothing is persisted here: the
 * public `siteContent` documents must never hold an app password.
 */
export async function POST(request: NextRequest) {
  try {
    const adminEmail = await getVerifiedAdminEmail(request);
    if (!adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = rateLimit('test-email', getClientIp(request), 5, 10 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const config = getSmtpConfig();
    if (!config) {
      return NextResponse.json(
        {
          error:
            'Email is not configured on the server. Set SMTP_USER, SMTP_PASS and CONTACT_RECEIVER_EMAIL in the environment.',
        },
        { status: 503 }
      );
    }

    const sent = await sendTestEmail(config);
    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send the test email. Check the server SMTP credentials.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${config.recipientEmail}.`,
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ error: 'Failed to send test email.' }, { status: 500 });
  }
}
