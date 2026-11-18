import { describe, it, expect } from 'vitest';
import {
  checkPasswordPolicy,
  isPasswordBreached,
  MIN_PASSWORD_LENGTH,
} from '../passwordPolicy';

describe('checkPasswordPolicy', () => {
  it('rejects short passwords', () => {
    const result = checkPasswordPolicy('a'.repeat(MIN_PASSWORD_LENGTH - 1));
    expect(result.ok).toBe(false);
  });

  it('rejects a repeated single character', () => {
    expect(checkPasswordPolicy('a'.repeat(16)).ok).toBe(false);
  });

  it('rejects obvious sequences', () => {
    expect(checkPasswordPolicy('passwordpassword').ok).toBe(false);
  });

  it('accepts a long random password', () => {
    expect(checkPasswordPolicy('vN7#qL2$wR9!tY4k').ok).toBe(true);
  });
});

describe('isPasswordBreached', () => {
  const suffixFor = async (password: string) => {
    const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  };

  it('detects a password present in the range response', async () => {
    const hash = await suffixFor('Compromised-Passw0rd!');
    const fakeFetch = (async () =>
      new Response(`${hash.slice(5)}:42\r\nFFFF:1`)) as typeof fetch;
    await expect(isPasswordBreached('Compromised-Passw0rd!', fakeFetch)).resolves.toBe(true);
  });

  it('returns false when the suffix is absent', async () => {
    const fakeFetch = (async () => new Response('AAAAAAAA:3')) as typeof fetch;
    await expect(isPasswordBreached('Not-In-The-List-123!', fakeFetch)).resolves.toBe(false);
  });

  it('fails open when the service is unreachable', async () => {
    const fakeFetch = (async () => {
      throw new Error('offline');
    }) as typeof fetch;
    await expect(isPasswordBreached('Anything-At-All-1!', fakeFetch)).resolves.toBe(false);
  });
});
