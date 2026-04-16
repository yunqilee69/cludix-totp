import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { optimize } from 'svgo';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons');
const sourceSvg = path.resolve(process.argv[2] || path.join(iconsDir, 'icon.svg'));

const sizes = [32, 128, 512];

async function ensureSourceExists(filePath) {
  await fs.promises.access(filePath, fs.constants.R_OK);
}

async function renderPng(svgContent, size, outputName) {
  const outputPath = path.join(iconsDir, outputName);
  await sharp(Buffer.from(svgContent))
    .resize(size, size)
    .png()
    .toFile(outputPath);
  return outputPath;
}

function createIcoHeader(imageBuffers) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(imageBuffers.length, 4);

  const entries = [];
  let offset = 6 + imageBuffers.length * 16;

  for (const { size, buffer } of imageBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...entries]);
}

async function writeIco(svgContent) {
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const imageBuffers = await Promise.all(
    icoSizes.map(async (size) => ({
      size,
      buffer: await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toBuffer(),
    }))
  );

  const header = createIcoHeader(imageBuffers);
  const icoPath = path.join(iconsDir, 'icon.ico');
  await fs.promises.writeFile(icoPath, Buffer.concat([header, ...imageBuffers.map(({ buffer }) => buffer)]));
  return icoPath;
}

async function main() {
  await ensureSourceExists(sourceSvg);
  const rawSvg = await fs.promises.readFile(sourceSvg, 'utf8');
  const optimizedSvg = optimize(rawSvg, {
    multipass: true,
    plugins: ['preset-default'],
  }).data;

  await Promise.all([
    ...sizes.map((size) => renderPng(optimizedSvg, size, `${size}x${size}.png`)),
    writeIco(optimizedSvg),
  ]);

  console.log(`App icons generated from ${sourceSvg}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
