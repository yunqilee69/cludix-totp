/**
 * QR Code Parser for TOTP URIs
 * Uses qr-scanner library to decode QR codes from image files
 */

import QrScanner from 'qr-scanner';
import { parseOtpAuthUri, TotpAccount } from './uriParser';

/**
 * Parse QR code from image file and extract TOTP account
 * @param file - Image file (PNG, JPG, etc.)
 * @returns TotpAccount if QR contains valid otpauth:// URI
 * @throws Error if QR not found or URI invalid
 */
export async function parseQrFromFile(file: File): Promise<TotpAccount> {
  try {
    // Decode QR code from image
    const qrContent = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
    
    const uri = typeof qrContent === 'string' ? qrContent : qrContent.data;
    
    // Validate it's an otpauth URI
    if (!uri.startsWith('otpauth://totp/')) {
      throw new Error('二维码内容不是有效的 TOTP URI 格式');
    }
    
    // Parse the URI using existing parser
    return parseOtpAuthUri(uri);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('No QR code found')) {
        throw new Error('图片中未找到二维码');
      }
      throw err;
    }
    throw new Error('二维码解析失败');
  }
}

/**
 * Check if QR scanner is supported in current environment
 */
export async function isQrScannerSupported(): Promise<boolean> {
  try {
    return await QrScanner.hasCamera();
  } catch {
    return false;
  }
}