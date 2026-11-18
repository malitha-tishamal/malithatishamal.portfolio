/**
 * Password policy (NIST SP 800-63B style: length over composition rules).
 *
 * Firebase handles hashing server-side (scrypt) — we cannot choose Argon2id
 * without moving to Identity Platform, so this module focuses on what the
 * client can enforce: minimum length and breach lookups.
 */

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

export interface PasswordPolicyResult {
  ok: boolean;
  message?: string;
}

const OBVIOUS_SEQUENCES = /^(?:0123456789|1234567890|abcdefgh|qwerty|password|letmein|admin)/i;

export function checkPasswordPolicy(password: string): PasswordPolicyResult {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`,
    };
  }
  if (/^(.)\1+$/.test(password)) {
    return { ok: false, message: 'Password cannot be a single repeated character.' };
  }
  if (OBVIOUS_SEQUENCES.test(password)) {
    return { ok: false, message: 'Password is too predictable. Choose something less common.' };
  }
  return { ok: true };
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Breach check via the HIBP range API using k-anonymity: only the first five
 * SHA-1 characters ever leave the browser. Fails open (returns false) when the
 * service is unreachable so signup is never blocked by a third party.
 */
export async function isPasswordBreached(
  password: string,
  fetchImpl: typeof fetch = fetch
): Promise<boolean> {
  try {
    const data = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-1', data);
    const hash = toHex(digest);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const res = await fetchImpl(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });
    if (!res.ok) return false;

    const body = await res.text();
    return body.split('\n').some((line) => {
      const [candidate, count] = line.trim().split(':');
      return candidate === suffix && Number(count) > 0;
    });
  } catch {
    return false;
  }
}
