import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendNewsletterNotification, sendTestEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Add subscriber to Firestore
    await addDoc(collection(db, 'newsletterSubscribers'), {
      email,
      subscribedAt: serverTimestamp(),
      status: 'active',
    });

    // Get footer settings to check if email notifications are enabled
    const footerDoc = await getDoc(doc(db, 'siteContent', 'footer'));
    const footerData = footerDoc.exists() ? footerDoc.data() : null;
    
    const enableNotifications = footerData?.enableNewsletterNotifications ?? true;
    const enableGmailSmtp = footerData?.gmailSmtpEnabled ?? false;
    
    // Send email notification using Gmail SMTP if enabled
    if (enableNotifications && enableGmailSmtp) {
      const smtpUser = footerData?.gmailSmtpUser || '';
      const appPassword = footerData?.gmailSmtpAppPassword || '';
      const recipientEmail = footerData?.gmailNotificationRecipient || footerData?.newsletterNotificationEmail || 'malithatishamal@gmail.com';
      
      if (smtpUser && appPassword && recipientEmail) {
        const emailSent = await sendNewsletterNotification(email, {
          smtpUser,
          appPassword,
          recipientEmail,
        });
        
        if (!emailSent) {
          console.warn('Email notification failed, but subscription was successful');
        }
      }
    } else if (enableNotifications) {
      // Fallback to console logging if SMTP not configured
      const notificationEmail = footerData?.newsletterNotificationEmail || 'malithatishamal@gmail.com';
      console.log('📧 Newsletter Subscription Notification');
      console.log('=====================================');
      console.log(`To: ${notificationEmail}`);
      console.log(`New Subscriber: ${email}`);
      console.log(`Time: ${new Date().toISOString()}`);
      console.log('=====================================');
      console.log('Note: Configure Gmail SMTP in Admin Panel for automatic email delivery');
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