/**
 * otpauth:// URI parser
 * Delegates parsing to OTPAuth for standards-compatible behavior.
 */

import * as OTPAuth from 'otpauth';
import { TotpConfig } from './totp';

export type CodeVisibility = 'inherit' | 'hidden' | 'visible';

export interface TotpAccount {
  id: string;
  issuer: string;
  account: string;
  uri: string;
  config: TotpConfig;
  codeVisibility?: CodeVisibility;
}

function normalizeSecret(secret: string): string {
  return secret.trim().replace(/\s+/g, '').toUpperCase();
}

/**
 * Parse otpauth://totp URI
 */
export function parseOtpAuthUri(uri: string): TotpAccount {
  let parsed: OTPAuth.HOTP | OTPAuth.TOTP;

  try {
    parsed = OTPAuth.URI.parse(uri);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Invalid otpauth URI');
  }

  if (!(parsed instanceof OTPAuth.TOTP)) {
    throw new Error('Invalid URI: must be otpauth://totp format');
  }

  const secret = normalizeSecret(parsed.secret.base32);
  const algorithm = parsed.algorithm.toUpperCase() as TotpConfig['algorithm'];

  if (!['SHA1', 'SHA256', 'SHA512'].includes(algorithm)) {
    throw new Error(`Invalid algorithm: ${parsed.algorithm}`);
  }

  if (![6, 8].includes(parsed.digits)) {
    throw new Error(`Invalid digits: ${parsed.digits}`);
  }

  if (parsed.period <= 0) {
    throw new Error(`Invalid period: ${parsed.period}`);
  }

  const issuer = parsed.issuer || '';
  const account = parsed.label;
  const normalizedUri = parsed.toString();
  const id = `${issuer}:${account}:${secret.slice(0, 4)}`;

  return {
    id,
    issuer,
    account,
    uri: normalizedUri,
    config: {
      secret,
      digits: parsed.digits,
      period: parsed.period,
      algorithm,
    },
  };
}

/**
 * Validate otpauth URI format
 */
export function isValidOtpAuthUri(uri: string): boolean {
  try {
    parseOtpAuthUri(uri);
    return true;
  } catch {
    return false;
  }
}
