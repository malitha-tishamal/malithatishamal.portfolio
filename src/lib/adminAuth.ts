/**
 * Server-side admin authorization for API routes WITHOUT firebase-admin.
 *
 * The browser sends the signed-in admin's Firebase ID token in the
 * `Authorization: Bearer <token>` header. We verify that token with Google's
 * Identity Toolkit (valid, unexpired, issued by THIS project), then read the
 * caller's own `users/{uid}` profile with the same token — Firestore rules
 * allow a user to read their own document. Admin access requires ALL of:
 *
 *   1. a valid ID token,
 *   2. `email_verified === true`,
 *   3. an allow-listed email (ADMIN_EMAILS),
 *   4. a profile with role=admin, status=approved, isApproved=true.
 *
 * The verified email is cryptographically tied to the token, so it is safe to
 * key the allow-list on it.
 */

const DEFAULT_ADMIN = "malithatishamal@gmail.com";

function adminAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAILS || DEFAULT_ADMIN;
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function projectId(): string {
  return process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
}

interface VerifiedIdentity {
  email: string;
  uid: string;
  emailVerified: boolean;
}

async function verifyIdToken(token: string): Promise<VerifiedIdentity | null> {
  const apiKey = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
  if (!apiKey) return null;

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
  const email = String(user?.email || "").toLowerCase();
  const uid = String(user?.localId || "");
  if (!email || !uid) return null;

  return { email, uid, emailVerified: user?.emailVerified === true };
}

/** True only for role=admin, status=approved, isApproved=true in Firestore. */
async function isApprovedAdminProfile(uid: string, token: string): Promise<boolean> {
  const project = projectId();
  if (!project) return false;

  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}` +
    `/databases/(default)/documents/users/${encodeURIComponent(uid)}`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!resp.ok) return false;

  const data = await resp.json();
  const fields = data?.fields || {};
  return (
    fields?.role?.stringValue === "admin" &&
    fields?.status?.stringValue === "approved" &&
    fields?.isApproved?.booleanValue === true
  );
}

/**
 * Returns the verified admin email if the request carries a valid Firebase ID
 * token belonging to an approved admin; otherwise null.
 */
export async function getVerifiedAdminEmail(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  if (!token || token.length > 4096) return null;

  try {
    const identity = await verifyIdToken(token);
    if (!identity) return null;
    if (!identity.emailVerified) return null;
    if (!adminAllowlist().includes(identity.email)) return null;
    if (!(await isApprovedAdminProfile(identity.uid, token))) return null;

    return identity.email;
  } catch {
    return null;
  }
}
