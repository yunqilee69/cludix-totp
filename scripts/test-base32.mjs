import crypto from 'crypto';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(str) {
  const cleanStr = str.toUpperCase().replace(/\s+/g, '').replace(/=+$/, '');
  
  let buffer = 0;
  let bits = 0;
  const result = [];
  
  for (const char of cleanStr) {
    const val = BASE32_CHARS.indexOf(char);
    if (val === -1) continue;
    
    buffer = (buffer << 5) | val;
    bits += 5;
    
    if (bits >= 8) {
      result.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  
  return Buffer.from(result);
}

function generateTotp(secret, timestamp = Date.now(), period = 30, digits = 6) {
  const secretBytes = base32Decode(secret);
  const timeStep = Math.floor(timestamp / 1000 / period);
  
  // 8-byte big-endian counter
  const counter = Buffer.alloc(8);
  counter.writeBigInt64BE(BigInt(timeStep), 0);
  
  // HMAC-SHA1
  const hmac = crypto.createHmac('sha1', secretBytes);
  hmac.update(counter);
  const digest = hmac.digest();
  
  // Dynamic truncation
  const offset = digest[digest.length - 1] & 0x0f;
  const binaryCode =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  
  const code = binaryCode % Math.pow(10, digits);
  return code.toString().padStart(digits, '0');
}

const secret = 'IYS4Y4UKUKHMKJTS5N2ORYYSJWQEFAPW';

console.log('=== TOTP Test ===');
console.log('Secret:', secret);

const decoded = base32Decode(secret);
console.log('Decoded (hex):', decoded.toString('hex'));
console.log('Length:', decoded.length, 'bytes');

const now = Date.now();
console.log('\nCurrent time:', now);
console.log('Current TOTP:', generateTotp(secret, now));

// Test at specific known time for verification
// Using a timestamp where we can cross-check
const testTime = Math.floor(Date.now() / 1000 / 30) * 30 * 1000;
console.log('\nAligned time:', testTime);
console.log('TOTP at aligned time:', generateTotp(secret, testTime));

// Show 3 consecutive codes
console.log('\n--- Consecutive codes ---');
for (let i = -1; i <= 2; i++) {
  const t = testTime + i * 30 * 1000;
  const remaining = 30 - (Math.floor(Date.now() / 1000) % 30);
  console.log(`Time: ${t}, Code: ${generateTotp(secret, t)}`);
}