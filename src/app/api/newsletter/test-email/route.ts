import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendTestEmail } from '@/lib/email';
import { getVerifiedAdminEmail } from '@/lib/adminAuth';
import { isValidEmail, cleanString, isSafeHeaderValue } from '@/utils/validation';
import { rateLimit, getClientIp } from '@/utils/rateLimit';
import { encrypt } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const adminEmail = await getVerifiedAdminEmail(request);
    if (!adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIp(request);
    const rl = rateLimit('test-email', ip, 5, 10 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const smtpUser = cleanString(body?.smtpUser, 254);
    const appPassword = cleanString(body?.appPassword, 64);
    const recipientEmail = cleanString(body?.recipientEmail, 254).toLowerCase();

    if (!smtpUser || !appPassword || !recipientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: smtpUser, appPassword, recipientEmail' },
        { status: 400 }
      );
    }

    if (!isValidEmail(smtpUser) || !isValidEmail(recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!isSafeHeaderValue(smtpUser) || !isSafeHeaderValue(recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid input detected.' },
        { status: 400 }
      );
    }

    // Clean the app password (remove spaces)
    const cleanAppPassword = appPassword.replace(/\s/g, '');

    if (cleanAppPassword.length !== 16) {
      return NextResponse.json(
        { error: 'App password must be exactly 16 characters' },
        { status: 400 }
      );
    }

    // Send test email
    const emailSent = await sendTestEmail({
      smtpUser,
      appPassword: cleanAppPassword,
      recipientEmail,
    });

    if (emailSent) {
      // Save the configuration to Firestore if test was successful.
      // The app password is encrypted at rest — never stored as plaintext.
      await updateDoc(doc(db, 'siteContent', 'footer'), {
        gmailSmtpEnabled: true,
        gmailSmtpUser: smtpUser,
        gmailSmtpAppPassword: encrypt(cleanAppPassword),
        gmailNotificationRecipient: recipientEmail,
        updatedAt: serverTimestamp(),
      });

      return NextResponse.json(
        { success: true, message: 'Test email sent successfully! Configuration saved.' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send test email. Please check your app password and try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email. Please try again.' },
      { status: 500 }
    );
  }
}