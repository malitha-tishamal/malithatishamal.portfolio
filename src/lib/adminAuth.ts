/**
 * Server-side admin authorization for API routes WITHOUT firebase-admin.
 *
 * The browser sends the signed-in admin's Firebase ID token in the
 * `Authorization: Bearer <token>` header. We verify that token by asking
 * Google's Identity Toolkit to look it up (this confirms the token is valid,
 * unexpired, and was issued by THIS Firebase project), then authorize purely
 * by matching the verified email against an admin allowlist.
 *
 * Why an allowlist and not a Firestore role read: under the hardened security
 * rules an unauthenticated server process cannot read `users/{uid}`, and we
 * deliberately avoid shipping a service-account key. The verified email is
 * cryptographically tied to the token, so the allowlist is a safe gate.
 */

const DEFAULT_ADMIN = "malithatishamal@gmail.com";

function adminAllowlist(): string[] {
  const raw =
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_INITIAL_ADMIN_EMAIL ||
    DEFAULT_ADMIN;
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns the verified admin email if the request carries a valid Firebase ID
 * token belonging to an allowlisted admin; otherwise null.
 */
export async function getVerifiedAdminEmail(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  if (!token || token.length > 4096) return null;

  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    "";
  if (!apiKey) return null;

  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
        cache: "no-store",
      }
    );
    if (!resp.ok) return null;

    const data = await resp.json();
    const user = Array.isArray(data?.users) ? data.users[0] : null;
    const email = (user?.email || "").toLowerCase();
    if (!email) return null;

    return adminAllowlist().includes(email) ? email : null;
  } catch {
    return null;
  }
}
