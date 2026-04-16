/**
 * TOTP (Time-based One-Time Password) implementation
 * Using otpauth library (https://github.com/hectorm/otpauth)
 */

import * as OTPAuth from 'otpauth';

export interface TotpConfig {
  secret: string;      // Base32 encoded secret
  digits: number;      // Number of digits (typically 6)
  period: number;      // Time period in seconds (typically 30)
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
}

/**
 * Create TOTP instance from config
 */
export function createTotp(config: TotpConfig): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    algorithm: config.algorithm,
    digits: config.digits,
    period: config.period,
    secret: OTPAuth.Secret.fromBase32(config.secret)
  });
}

/**
 * Generate TOTP code for given config
 */
export function generateTotp(config: TotpConfig): string {
  const totp = createTotp(config);
  return totp.generate({ timestamp: Date.now() });
}

/**
 * Get remaining seconds until next TOTP refresh
 */
export function getRemainingSeconds(period: number): number {
  // OTPAuth.TOTP.remaining returns milliseconds, convert to seconds
  return Math.floor(OTPAuth.TOTP.remaining({ period }) / 1000);
}

/**
 * Get progress percentage for UI display
 */
export function getProgressPercent(period: number): number {
  const remaining = getRemainingSeconds(period);
  return (remaining / period) * 100;
}