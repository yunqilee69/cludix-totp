import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a 32x32 PNG with gradient colors
const png = new PNG({ width: 32, height: 32 });

for (let y = 0; y < 32; y++) {
  for (let x = 0; x < 32; x++) {
    const idx = (png.width * y + x) << 2;
    // Gradient from purple to blue
    const r = Math.floor(102 + (126 - 102) * (x / 32));
    const g = Math.floor(126 + (234 - 126) * (y / 32));
    const b = 234;
    png.data[idx] = r;
    png.data[idx + 1] = g;
    png.data[idx + 2] = b;
    png.data[idx + 3] = 255; // alpha
  }
}

// Get PNG buffer
const pngBuffer = PNG.sync.write(png);

// Create ICO file structure
// ICO can contain PNG data directly (Windows XP+)
const iconDir = Buffer.alloc(6);
iconDir.writeUInt16LE(0, 0);    // Reserved
iconDir.writeUInt16LE(1, 2);    // Type: 1 = icon
iconDir.writeUInt16LE(1, 4);    // Count: 1 image

const iconDirEntry = Buffer.alloc(16);
iconDirEntry.writeUInt8(32, 0);         // Width
iconDirEntry.writeUInt8(32, 1);         // Height
iconDirEntry.writeUInt8(0, 2);          // ColorCount (0 for 32-bit)
iconDirEntry.writeUInt8(0, 3);          // Reserved
iconDirEntry.writeUInt16LE(1, 4);       // Planes
iconDirEntry.writeUInt16LE(32, 6);      // BitCount (32-bit)
iconDirEntry.writeUInt32LE(pngBuffer.length, 8);  // Size
iconDirEntry.writeUInt32LE(22, 12);     // Offset (6 + 16 = 22)

// Combine all parts
const icoBuffer = Buffer.concat([iconDir, iconDirEntry, pngBuffer]);

// Write ICO file
const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons');
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuffer);

// Also write PNG files for other platforms
fs.writeFileSync(path.join(iconsDir, '32x32.png'), pngBuffer);
fs.writeFileSync(path.join(iconsDir, '128x128.png'), pngBuffer); // Same size for now

console.log('Icon files created successfully!');