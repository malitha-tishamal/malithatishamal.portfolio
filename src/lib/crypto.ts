/**
 * Server-side encryption-at-rest for sensitive secrets (AES-256-GCM).
 *
 * Used to protect credentials such as the Gmail SMTP app password before they
 * are written to Firestore, so a database dump never exposes plaintext secrets.
 *
 * Runtime: Node (uses node:crypto). Do NOT import this from client components
 * or from the Edge middleware.
 *
 * Key management:
 *  - Set ENCRYPTION_KEY in .env.local (any strong random string, e.g. the output
 *    of `openssl rand -hex 32`). A 32-byte key is derived from it via scrypt
 *    with a fixed application salt.
 *  - If ENCRYPTION_KEY is not configured, encrypt() is a passthrough and values
 *    are stored as-is, so nothing breaks before you add the key. Once the key is
 *    set, all NEW writes are encrypted.
 *
 * Format:  enc:v1:<base64(iv[12] | authTag[16] | ciphertext)>
 * decrypt() is backward compatible — a value without the prefix is treated as
 * legacy plaintext and returned unchanged, so existing data keeps working.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;
const SALT = "malithatishamal::at-rest::v1";

function getKey(): Buffer | null {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || !secret.trim()) return null;
  return scryptSync(secret.trim(), SALT, 32);
}

/** True when a stored value carries our encryption envelope. */
export function isEncrypted(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(PREFIX);
}

/**
 * Encrypt a secret. Returns the original string unchanged when it is empty or
 * when ENCRYPTION_KEY is not configured (backward-compatible passthrough).
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getKey();
  if (!key) return plaintext;

  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/**
 * Decrypt a value produced by encrypt(). Legacy plaintext (no prefix) is
 * returned as-is. Returns "" on failure (missing key, tampering, wrong key) so
 * callers fail safe rather than leaking a partial secret.
 */
export function decrypt(value: string): string {
  if (!value) return value;
  if (!isEncrypted(value)) return value; // legacy plaintext

  const key = getKey();
  if (!key) {
    console.warn(
      "[crypto] Found an encrypted secret but ENCRYPTION_KEY is not set. Cannot decrypt."
    );
    return "";
  }

  try {
    const raw = Buffer.from(value.slice(PREFIX.length), "base64");
    if (raw.length <= IV_LEN + TAG_LEN) return "";
    const iv = raw.subarray(0, IV_LEN);
    const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const data = raw.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8"
    );
  } catch (err) {
    console.error("[crypto] Decryption failed:", err);
    return "";
  }
}
