/**
 * otpauth:// URI parser
 * Parses Google Authenticator compatible URI format
 */

import { TotpConfig } from './totp';

export interface TotpAccount {
  id: string;
  issuer: string;
  account: string;
  uri: string;
  config: TotpConfig;
}

/**
 * Parse otpauth://totp URI
 * Format: otpauth://totp/[issuer]:[account]?secret=[Base32]&issuer=[issuer]&algorithm=[SHA1]&digits=[6]&period=[30]
 */
export function parseOtpAuthUri(uri: string): TotpAccount {
  if (!uri.startsWith('otpauth://totp/')) {
    throw new Error('Invalid URI: must be otpauth://totp format');
  }

  // Remove the otpauth://totp/ prefix
  const rest = uri.slice('otpauth://totp/'.length);

  // Split path and query
  const [pathPart, queryPart] = rest.split('?');

  // Parse account info from path
  // Format: issuer:account or just account
  let issuer = '';
  let account = '';

  if (pathPart.includes(':')) {
    const colonIndex = pathPart.indexOf(':');
    issuer = decodeURIComponent(pathPart.slice(0, colonIndex));
    account = decodeURIComponent(pathPart.slice(colonIndex + 1));
  } else {
    account = decodeURIComponent(pathPart);
  }

  // Parse query parameters
  const params = new URLSearchParams(queryPart || '');

  // Secret is required
  const secret = params.get('secret');
  if (!secret) {
    throw new Error('Missing required parameter: secret');
  }

  // Issuer can be in query params too (takes precedence if present)
  const queryIssuer = params.get('issuer');
  if (queryIssuer) {
    issuer = decodeURIComponent(queryIssuer);
  }

  // Algorithm (default SHA1)
  const algorithmParam = params.get('algorithm') || 'SHA1';
  const algorithm: 'SHA1' | 'SHA256' | 'SHA512' =
    algorithmParam.toUpperCase() as 'SHA1' | 'SHA256' | 'SHA512';

  if (!['SHA1', 'SHA256', 'SHA512'].includes(algorithm)) {
    throw new Error(`Invalid algorithm: ${algorithmParam}`);
  }

  // Digits (default 6)
  const digits = parseInt(params.get('digits') || '6', 10);
  if (![6, 8].includes(digits)) {
    throw new Error(`Invalid digits: ${digits}`);
  }

  // Period (default 30)
  const period = parseInt(params.get('period') || '30', 10);
  if (period <= 0) {
    throw new Error(`Invalid period: ${period}`);
  }

  // Generate unique ID
  const id = `${issuer}:${account}:${secret.slice(0, 4)}`;

  return {
    id,
    issuer,
    account,
    uri,
    config: {
      secret,
      digits,
      period,
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