import { NextResponse } from "next/server";
import { getVerifiedAdminEmail } from "@/lib/adminAuth";
import { getSmtpConfig, getSmtpStatus } from "@/lib/smtpConfig";
import { sendTestEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/utils/rateLimit";

/**
 * Admin-only SMTP status + test endpoint.
 *
 * Credentials live in the server environment and are never accepted from the
 * browser, written to disk at runtime, or stored in Firestore / `.env.local`.
 */
export async function GET(req: Request) {
  const adminEmail = await getVerifiedAdminEmail(req);
  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(getSmtpStatus());
}

export async function POST(req: Request) {
  try {
    const adminEmail = await getVerifiedAdminEmail(req);
    if (!adminEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit("smtp-config", getClientIp(req), 5, 10 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const config = getSmtpConfig();
    if (!config) {
      return NextResponse.json(
        {
          error:
            "Email is not configured on the server. Set SMTP_USER, SMTP_PASS and CONTACT_RECEIVER_EMAIL.",
        },
        { status: 503 }
      );
    }

    const sent = await sendTestEmail(config);
    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send the test email. Check the server SMTP credentials." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      testSent: true,
      message: `Test email sent to ${config.recipientEmail}.`,
    });
  } catch (err) {
    console.error("Error in smtp-config route:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
