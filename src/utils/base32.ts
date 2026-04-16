/**
 * Base32 decode (RFC 4648) - for TOTP secret decoding
 * Google Authenticator uses Base32 without padding
 */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Decode(str: string): Uint8Array {
  // Remove whitespace and padding
  const cleanStr = str.toUpperCase().replace(/\s+/g, '').replace(/=+$/, '');

  // Validate characters
  for (const char of cleanStr) {
    if (!BASE32_CHARS.includes(char)) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }
  }

  // Standard Base32 decode: accumulate 5 bits per char, emit byte when >= 8 bits
  let buffer = 0;
  let bits = 0;
  const result: number[] = [];

  for (const char of cleanStr) {
    const val = BASE32_CHARS.indexOf(char);
    buffer = (buffer << 5) | val;
    bits += 5;

    if (bits >= 8) {
      result.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(result);
}