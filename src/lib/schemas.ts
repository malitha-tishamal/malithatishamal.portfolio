import { z } from 'zod';

/**
 * Strict request-body schemas for public API routes.
 *
 * `z.strictObject` rejects unknown keys, so a client cannot smuggle extra
 * fields into Firestore writes or SMTP calls. Length caps mirror the limits
 * already enforced by `cleanString` in src/utils/validation.ts.
 */

export const contactSchema = z.strictObject({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional().default(''),
  email: z.string().trim().min(3).max(254),
  country: z.string().trim().max(100).optional().default(''),
  serviceCategory: z.string().trim().max(100).optional().default(''),
  message: z.string().trim().min(1).max(5000),
  // Legacy field still sent by cached client bundles. Accepted so older tabs
  // keep working, but always ignored: the recipient is server-controlled.
  notificationEmail: z.string().trim().max(254).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const newsletterSchema = z.strictObject({
  email: z.string().trim().min(3).max(254),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

/** Maximum accepted JSON body size for public endpoints (bytes). */
export const PUBLIC_JSON_LIMIT = 32 * 1024;

export class RequestBodyError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'RequestBodyError';
    this.status = status;
  }
}

/**
 * Read and parse a JSON request body with a hard byte cap.
 *
 * `Content-Length` is checked first, then the actual decoded length, so a
 * chunked request without a length header cannot bypass the limit.
 */
export async function readJsonBody(
  req: Request,
  maxBytes: number = PUBLIC_JSON_LIMIT
): Promise<unknown> {
  const contentType = (req.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (contentType && contentType !== 'application/json') {
    throw new RequestBodyError('Unsupported content type.', 415);
  }

  const declared = Number(req.headers.get('content-length') || '0');
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new RequestBodyError('Request body too large.', 413);
  }

  const text = await req.text();
  if (text.length > maxBytes) {
    throw new RequestBodyError('Request body too large.', 413);
  }
  if (!text) {
    throw new RequestBodyError('Request body is required.', 400);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new RequestBodyError('Invalid JSON body.', 400);
  }
}

/** Convert a Zod error into a short, non-leaking validation message. */
export function validationMessage(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return 'Invalid request.';
  const path = first.path.join('.');
  return path ? `Invalid field: ${path}.` : 'Invalid request.';
}
