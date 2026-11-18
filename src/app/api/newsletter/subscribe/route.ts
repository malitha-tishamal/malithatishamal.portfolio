import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendNewsletterNotification } from '@/lib/email';
import { isValidEmail, cleanString } from '@/utils/validation';
import { distributedRateLimit, getClientIp } from '@/utils/rateLimit';
import { getSmtpConfig } from '@/lib/smtpConfig';
import {
  newsletterSchema,
  readJsonBody,
  validationMessage,
  RequestBodyError,
} from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = await distributedRateLimit('newsletter', ip, 5, 10 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    let parsed;
    try {
      parsed = newsletterSchema.safeParse(await readJsonBody(request));
    } catch (bodyErr) {
      if (bodyErr instanceof RequestBodyError) {
        return NextResponse.json({ error: bodyErr.message }, { status: bodyErr.status });
      }
      throw bodyErr;
    }
    if (!parsed.success) {
      return NextResponse.json(
        { error: validationMessage(parsed.error) },
        { status: 400 }
      );
    }

    const email = cleanString(parsed.data.email, 254).toLowerCase();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // De-duplicate: skip if this address is already an active subscriber.
    try {
      const q = query(
        collection(db, 'newsletterSubscribers'),
        where('email', '==', email),
        limit(1)
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        return NextResponse.json(
          { success: true, message: 'Successfully subscribed!' },
          { status: 200 }
        );
      }
    } catch {
      // Query may fail if a composite index is missing — proceed to add.
    }

    // Add subscriber to Firestore
    await addDoc(collection(db, 'newsletterSubscribers'), {
      email,
      subscribedAt: serverTimestamp(),
      status: 'active',
    });

    // Notifications use the server-side SMTP configuration. The public footer
    // document only carries the non-secret on/off switch.
    const smtpConfig = getSmtpConfig();
    let notificationsEnabled = true;
    try {
      const footerDoc = await getDoc(doc(db, 'siteContent', 'footer'));
      notificationsEnabled =
        footerDoc.exists() ? footerDoc.data()?.enableNewsletterNotifications ?? true : true;
    } catch {
      // A read failure should never block the subscription itself.
    }

    if (smtpConfig && notificationsEnabled) {
      const emailSent = await sendNewsletterNotification(email, smtpConfig);
      if (!emailSent) {
        console.warn('Newsletter notification email failed; subscription was still saved.');
      }
    }

    return NextResponse.json(
      { success: true, message: 'Successfully subscribed!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}