import { describe, it, expect } from 'vitest';
import {
  contactSchema,
  newsletterSchema,
  readJsonBody,
  RequestBodyError,
} from '../schemas';

describe('contactSchema', () => {
  const valid = {
    firstName: 'Ada',
    email: 'ada@example.com',
    message: 'I need a website.',
  };

  it('accepts a valid payload and defaults optional fields', () => {
    const parsed = contactSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.lastName).toBe('');
      expect(parsed.data.country).toBe('');
      expect(parsed.data.serviceCategory).toBe('');
    }
  });

  it('rejects unknown keys (mass-assignment guard)', () => {
    const parsed = contactSchema.safeParse({ ...valid, role: 'admin' });
    expect(parsed.success).toBe(false);
  });

  it('rejects an overlong message', () => {
    const parsed = contactSchema.safeParse({ ...valid, message: 'x'.repeat(5001) });
    expect(parsed.success).toBe(false);
  });

  it('rejects wrong types', () => {
    const parsed = contactSchema.safeParse({ ...valid, firstName: 42 });
    expect(parsed.success).toBe(false);
  });
});

describe('newsletterSchema', () => {
  it('accepts an email-only payload', () => {
    expect(newsletterSchema.safeParse({ email: 'a@b.co' }).success).toBe(true);
  });

  it('rejects extra keys', () => {
    expect(newsletterSchema.safeParse({ email: 'a@b.co', status: 'admin' }).success).toBe(false);
  });
});

describe('readJsonBody', () => {
  const jsonRequest = (body: string, headers: Record<string, string> = {}) =>
    new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body,
    });

  it('parses a valid JSON body', async () => {
    await expect(readJsonBody(jsonRequest('{"a":1}'))).resolves.toEqual({ a: 1 });
  });

  it('rejects a non-JSON content type', async () => {
    await expect(
      readJsonBody(jsonRequest('a=1', { 'content-type': 'text/plain' }))
    ).rejects.toBeInstanceOf(RequestBodyError);
  });

  it('rejects an oversized declared body', async () => {
    await expect(
      readJsonBody(jsonRequest('{}', { 'content-length': '999999' }), 1024)
    ).rejects.toMatchObject({ status: 413 });
  });

  it('rejects invalid JSON', async () => {
    await expect(readJsonBody(jsonRequest('{nope'))).rejects.toMatchObject({ status: 400 });
  });

  it('rejects an empty body', async () => {
    await expect(readJsonBody(jsonRequest(''))).rejects.toMatchObject({ status: 400 });
  });
});
