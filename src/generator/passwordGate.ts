import { createHash, randomBytes } from 'node:crypto';

import type { PasswordGate } from './types';

/**
 * Builds the salt + hash pair embedded in a generated page.
 *
 * Obfuscation-grade only: the digest ships inside the HTML, so this deters
 * casual access rather than enforcing it. The production gate flow lives with
 * the password-gate work; this helper exists so the generator and its tests can
 * produce gated pages on their own.
 */
export function createPasswordGate(password: string): PasswordGate {
  const salt = randomBytes(16).toString('hex');
  return { salt, hash: hashPassword(password, salt) };
}

export function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(`${password}${salt}`).digest('hex');
}
