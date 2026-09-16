import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export async function GET() {
  const smtpUser = process.env.SMTP_USER || "malithatishamal@gmail.com";
  const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || "malithatishamal@gmail.com";
  const hasPass = Boolean(process.env.SMTP_PASS && process.env.SMTP_PASS.trim().length > 0);

  return NextResponse.json({
    configured: hasPass,
    smtpUser,
    receiverEmail,
    smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
    hasPassword: hasPass,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { smtpUser, smtpPass, receiverEmail, testNow } = body;

    const targetUser = (smtpUser || process.env.SMTP_USER || "malithatishamal@gmail.com").trim();
    const targetReceiver = (receiverEmail || process.env.CONTACT_RECEIVER_EMAIL || targetUser).trim();
    const cleanPass = (smtpPass || "").trim().replace(/\s+/g, "");

    if (!cleanPass) {
      return NextResponse.json(
        { error: "App Password is required. Please generate a 16-character Google App Password." },
        { status: 400 }
      );
    }

    // Verify SMTP connection and optionally send test email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: targetUser,
        pass: cleanPass,
      },
    });

    let testSent = false;
    if (testNow) {
      try {
        await transporter.sendMail({
          from: `"Portfolio Notification Test" <${targetUser}>`,
          to: targetReceiver,
          subject: "🎉 Test Notification: Portfolio Contact Form Email is Working!",
          html: `
            <div style="font-family: sans-serif; background-color: #0b1120; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 550px; margin: auto;">
              <h2 style="color: #38bdf8; margin-top: 0;">🚀 Gmail SMTP Connected Successfully!</h2>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                Great news! Your portfolio website is now linked with Gmail SMTP. Whenever a visitor submits the <strong>&quot;Start the project&quot;</strong> contact form, you will receive an instant notification email right here.
              </p>
              <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; border-left: 4px solid #0a66c2; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #94a3b8;"><strong>Sender:</strong> ${targetUser}</p>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #94a3b8;"><strong>Receiver:</strong> ${targetReceiver}</p>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #94a3b8;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
                Sent from Malitha Tishamal Portfolio System.
              </p>
            </div>
          `,
          text: `Gmail SMTP connected successfully! Test notification sent to ${targetReceiver} at ${new Date().toLocaleString()}`,
        });
        testSent = true;
      } catch (authErr: any) {
        console.error("SMTP verification error:", authErr);
        let humanMsg = authErr.message || "Failed to authenticate with Gmail SMTP.";
        if (authErr.code === "EAUTH" || authErr.responseCode === 535) {
          humanMsg =
            "Invalid Google App Password or Username. Please make sure 2-Step Verification is ON in your Google Account and generate a new 16-character App Password at https://myaccount.google.com/apppasswords";
        }
        return NextResponse.json({ error: humanMsg }, { status: 401 });
      }
    }

    // Update .env.local file
    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = "";
    try {
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf-8");
      }
    } catch (e) {
      console.warn("Could not read .env.local:", e);
    }

    const updateOrAppend = (content: string, key: string, val: string) => {
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${val}`);
      }
      return `${content.trim()}\n${key}=${val}\n`;
    };

    envContent = updateOrAppend(envContent, "SMTP_USER", targetUser);
    envContent = updateOrAppend(envContent, "SMTP_PASS", cleanPass);
    envContent = updateOrAppend(envContent, "CONTACT_RECEIVER_EMAIL", targetReceiver);
    envContent = updateOrAppend(envContent, "SMTP_HOST", "smtp.gmail.com");
    envContent = updateOrAppend(envContent, "SMTP_PORT", "465");
    envContent = updateOrAppend(envContent, "SMTP_SECURE", "true");

    try {
      fs.writeFileSync(envPath, envContent, "utf-8");
    } catch (writeErr) {
      console.warn("Could not write to .env.local file:", writeErr);
    }

    // Also update in-memory process.env so it works immediately
    process.env.SMTP_USER = targetUser;
    process.env.SMTP_PASS = cleanPass;
    process.env.CONTACT_RECEIVER_EMAIL = targetReceiver;
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_SECURE = "true";

    return NextResponse.json({
      success: true,
      testSent,
      message: testSent
        ? `SMTP configured successfully and test email delivered to ${targetReceiver}!`
        : "SMTP credentials saved and active!",
    });
  } catch (err: any) {
    console.error("Error in smtp-config route:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error while configuring SMTP" },
      { status: 500 }
    );
  }
}
