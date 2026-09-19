/**
 * Email Service using Nodemailer with Gmail SMTP
 * This handles sending email notifications for newsletter subscriptions
 */

import nodemailer from 'nodemailer';

interface EmailConfig {
  smtpUser: string;
  appPassword: string;
  recipientEmail: string;
}

interface EmailContent {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Create Gmail SMTP transporter
 */
export const createGmailTransporter = (config: EmailConfig) => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: config.smtpUser,
      pass: config.appPassword,
    },
  });
};

/**
 * Send email using Gmail SMTP
 */
export const sendEmail = async (config: EmailConfig, content: EmailContent): Promise<boolean> => {
  try {
    const transporter = createGmailTransporter(config);

    const mailOptions = {
      from: config.smtpUser,
      to: content.to,
      subject: content.subject,
      html: content.html,
      text: content.text,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', content.to);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

/**
 * Send newsletter subscription notification
 */
export const sendNewsletterNotification = async (
  subscriberEmail: string,
  config: EmailConfig
): Promise<boolean> => {
  const emailContent: EmailContent = {
    to: config.recipientEmail,
    subject: '🎉 New Newsletter Subscription!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0a66c2 0%, #1e40af 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 New Newsletter Subscription</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Great news! You have a new subscriber to your newsletter.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0a66c2;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Subscription Details</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              <div>
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px;">Subscriber Email</p>
                <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0;">${subscriberEmail}</p>
              </div>
              
              <div>
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px;">Subscription Date</p>
                <p style="color: #1f2937; font-size: 16px; margin: 0;">${new Date().toLocaleDateString()}</p>
              </div>
              
              <div>
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px;">Status</p>
                <span style="display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Active</span>
              </div>
            </div>
          </div>
          
          <p style="color: #374151; font-size: 14px; line-height: 1.6;">
            This subscriber will now receive your newsletter updates. You can manage your subscribers in the Admin Panel under Footer Manager.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated notification from your website's newsletter system.
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin: 5px 0 0 0;">
              Malitha Tishamal Portfolio • ${new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      New Newsletter Subscription
      
      Subscriber Email: ${subscriberEmail}
      Subscription Date: ${new Date().toLocaleDateString()}
      Status: Active
      
      This subscriber will now receive your newsletter updates.
      
      ---
      This is an automated notification from your website's newsletter system.
      Malitha Tishamal Portfolio • ${new Date().getFullYear()}
    `,
  };

  return await sendEmail(config, emailContent);
};

/**
 * Send test email to verify SMTP configuration
 */
export const sendTestEmail = async (config: EmailConfig): Promise<boolean> => {
  const emailContent: EmailContent = {
    to: config.recipientEmail,
    subject: '🧪 Gmail SMTP Test - Newsletter System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🧪 SMTP Test Successful!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Congratulations! Your Gmail SMTP configuration is working correctly.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Configuration Details</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              <div>
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px;">SMTP User</p>
                <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0;">${config.smtpUser}</p>
              </div>
              
              <div>
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px;">Recipient</p>
                <p style="color: #1f2937; font-size: 16px; margin: 0;">${config.recipientEmail}</p>
              </div>
              
              <div>
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.5px;">Test Date</p>
                <p style="color: #1f2937; font-size: 16px; margin: 0;">${new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <p style="color: #374151; font-size: 14px; line-height: 1.6;">
            Your newsletter subscription system is now ready to send automatic email notifications when users subscribe to your newsletter.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is a test email from your website's newsletter system.
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin: 5px 0 0 0;">
              Malitha Tishamal Portfolio • ${new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Gmail SMTP Test - Newsletter System
      
      Configuration Details:
      SMTP User: ${config.smtpUser}
      Recipient: ${config.recipientEmail}
      Test Date: ${new Date().toLocaleString()}
      
      Your Gmail SMTP configuration is working correctly!
      Your newsletter subscription system is now ready.
      
      ---
      This is a test email from your website's newsletter system.
      Malitha Tishamal Portfolio • ${new Date().getFullYear()}
    `,
  };

  return await sendEmail(config, emailContent);
};