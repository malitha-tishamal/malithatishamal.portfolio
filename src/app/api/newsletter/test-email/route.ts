import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendTestEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { smtpUser, appPassword, recipientEmail } = body;

    if (!smtpUser || !appPassword || !recipientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: smtpUser, appPassword, recipientEmail' },
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
      // Save the configuration to Firestore if test was successful
      await updateDoc(doc(db, 'siteContent', 'footer'), {
        gmailSmtpEnabled: true,
        gmailSmtpUser: smtpUser,
        gmailSmtpAppPassword: cleanAppPassword,
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