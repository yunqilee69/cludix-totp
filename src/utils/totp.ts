/**
 * TOTP (Time-based One-Time Password) implementation
 * RFC 6238 compliant
 */

import { base32Decode } from './base32';

export interface TotpConfig {
  secret: string;      // Base32 encoded secret
  digits: number;      // Number of digits (typically 6)
  period: number;      // Time period in seconds (typically 30)
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
}

/**
 * Calculate TOTP code for given timestamp
 */
export async function generateTotp(config: TotpConfig, timestamp: number = Date.now()): Promise<string> {
  const secretBytes = base32Decode(config.secret);

  // Calculate time step (T = (timestamp - T0) / period)
  // T0 is typically 0 (Unix epoch)
  const timeStep = Math.floor(timestamp / 1000 / config.period);

  // Convert time step to 8-byte big-endian array
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, timeStep, false); // Big-endian, upper 4 bytes are 0

  // HMAC calculation using Web Crypto API
  const algorithm = config.algorithm.replace('SHA', 'SHA-');
  
  // Create a fresh ArrayBuffer with just the secret bytes
  const secretBuffer = new ArrayBuffer(secretBytes.length);
  new Uint8Array(secretBuffer).set(secretBytes);
  
  const key = await crypto.subtle.importKey(
    'raw',
    secretBuffer,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  );

  const hmacResult = await crypto.subtle.sign('HMAC', key, timeBuffer);
  const hmacBytes = new Uint8Array(hmacResult);

  // Dynamic truncation (RFC 6238 Section 4)
  const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
  const binaryCode =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);

  // Extract digits
  const code = binaryCode % Math.pow(10, config.digits);

  // Pad with leading zeros if needed
  return code.toString().padStart(config.digits, '0');
}

/**
 * Get remaining seconds until next TOTP refresh
 */
export function getRemainingSeconds(period: number, timestamp: number = Date.now()): number {
  const currentSecond = Math.floor(timestamp / 1000);
  return period - (currentSecond % period);
}

/**
 * Get progress percentage for UI display
 */
export function getProgressPercent(period: number, timestamp: number = Date.now()): number {
  const remaining = getRemainingSeconds(period, timestamp);
  return (remaining / period) * 100;
}