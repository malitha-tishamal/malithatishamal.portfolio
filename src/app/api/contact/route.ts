import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, country, serviceCategory, message, notificationEmail } = body;

    if (!firstName?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "First name, email, and project message are required." },
        { status: 400 }
      );
    }

    const recipient =
      notificationEmail ||
      process.env.CONTACT_RECEIVER_EMAIL ||
      "malithatishamal@gmail.com";

    const smtpUser = (process.env.SMTP_USER || "").trim();
    const smtpPass = (process.env.SMTP_PASS || "").trim().replace(/\s+/g, "");
    const smtpHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const smtpSecure = process.env.SMTP_SECURE !== "false";

    let emailSent = false;
    let emailError: string | null = null;

    if (smtpUser && smtpPass) {
      try {
        const transporter =
          smtpHost === "smtp.gmail.com"
            ? nodemailer.createTransport({
                service: "gmail",
                auth: {
                  user: smtpUser,
                  pass: smtpPass,
                },
              })
            : nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpSecure,
                auth: {
                  user: smtpUser,
                  pass: smtpPass,
                },
              });

        const fullName = `${firstName.trim()} ${lastName?.trim() || ""}`.trim();
        const dateStr = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Colombo",
          dateStyle: "full",
          timeStyle: "short",
        });

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Project Inquiry</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b1120; padding: 30px 15px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #0a66c2 0%, #2563eb 50%, #7c3aed 100%); padding: 32px 28px; text-align: left;">
                        <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; margin-bottom: 12px;">
                          🚀 New Portfolio Inquiry
                        </div>
                        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.25;">
                          ${fullName} wants to start a project!
                        </h1>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.85);">
                          Received via the &quot;Start the project&quot; consultation form
                        </p>
                      </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                      <td style="padding: 28px;">
                        <!-- Client Details Table -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border-radius: 12px; border: 1px solid #1e293b; margin-bottom: 24px; overflow: hidden;">
                          <tr>
                            <td style="padding: 14px 18px; border-bottom: 1px solid #1e293b; font-size: 13px; color: #94a3b8; width: 120px;">Client Name</td>
                            <td style="padding: 14px 18px; border-bottom: 1px solid #1e293b; font-size: 14px; font-weight: 700; color: #f8fafc;">${fullName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 14px 18px; border-bottom: 1px solid #1e293b; font-size: 13px; color: #94a3b8;">Email Address</td>
                            <td style="padding: 14px 18px; border-bottom: 1px solid #1e293b; font-size: 14px; color: #38bdf8;">
                              <a href="mailto:${email}" style="color: #38bdf8; text-decoration: none; font-weight: 600;">${email}</a>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 14px 18px; border-bottom: 1px solid #1e293b; font-size: 13px; color: #94a3b8;">Country</td>
                            <td style="padding: 14px 18px; border-bottom: 1px solid #1e293b; font-size: 14px; color: #f8fafc;">${country || "Not provided"}</td>
                          </tr>
                          ${serviceCategory ? `<tr>
                            <td style="padding: 14px 18px; border-bottom: 1px solid #1e293b; font-size: 13px; color: #94a3b8;">Service Category</td>
                            <td style="padding: 14px 18px; border-bottom: 1px solid #1e293b; font-size: 14px; color: #a78bfa; font-weight: 600;">${serviceCategory}</td>
                          </tr>` : ''}
                          <tr>
                            <td style="padding: 14px 18px; font-size: 13px; color: #94a3b8;">Date &amp; Time</td>
                            <td style="padding: 14px 18px; font-size: 13px; color: #cbd5e1;">${dateStr}</td>
                          </tr>
                        </table>

                        <!-- Message Box -->
                        <div style="margin-bottom: 28px;">
                          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 8px;">
                            💬 Project Overview &amp; Message:
                          </div>
                          <div style="background-color: #0f172a; border-left: 4px solid #0a66c2; border-radius: 0 10px 10px 0; padding: 18px; font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap;">${message.trim()}</div>
                        </div>

                        <!-- CTA Actions -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="padding-top: 10px;">
                              <a href="mailto:${email}?subject=Re:%20Your%20Project%20Inquiry%20-%20Malitha%20Tishamal" style="display: inline-block; background: linear-gradient(135deg, #0a66c2 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);">
                                ✉️ Reply to ${firstName}
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #0f172a; padding: 18px 28px; text-align: center; border-top: 1px solid #1e293b;">
                        <p style="margin: 0; font-size: 12px; color: #64748b;">
                          This notification was automatically sent to <strong style="color: #94a3b8;">${recipient}</strong> from your portfolio website.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: `"${fullName} (Portfolio Inquiry)" <${smtpUser}>`,
          to: recipient,
          replyTo: email,
          subject: `🚀 New Project Inquiry: ${fullName} (${country || "Global"})`,
          html: htmlContent,
          text: `New Inquiry from ${fullName} (${email}, ${country || "Global"}):\n\n${message}`,
        });

        emailSent = true;
      } catch (sendErr: any) {
        console.error("Nodemailer send error:", sendErr);
        emailError = sendErr?.message || "Error sending email via SMTP";
      }
    } else {
      console.warn(
        "[Contact API] SMTP_USER and SMTP_PASS are not configured in .env.local. Direct email notification skipped. The inquiry was safely stored in Firestore."
      );
    }

    return NextResponse.json({
      success: true,
      emailSent,
      emailError,
      message: emailSent
        ? "Inquiry sent successfully to email and recorded in database!"
        : "Inquiry saved in database! (Configure SMTP in .env.local to enable direct email notifications)",
    });
  } catch (err: any) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error processing contact inquiry" },
      { status: 500 }
    );
  }
}
