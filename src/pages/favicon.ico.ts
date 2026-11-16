import type { APIRoute } from 'astro';
import { brandIconPng } from '../utils/brandIcon';

// Browsers ask for /favicon.ico on their own. An .ico file can hold PNG images directly,
// so this writes the 6-byte header and one 16-byte entry per size, followed by the PNGs.
const SIZES = [16, 32, 48];

export const GET: APIRoute = async () => {
  const pngs = await Promise.all(SIZES.map(brandIconPng));
  const header = Buffer.alloc(6 + 16 * SIZES.length);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(SIZES.length, 4);
  let offset = header.length;
  SIZES.forEach((size, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry); // width
    header.writeUInt8(size, entry + 1); // height
    header.writeUInt16LE(1, entry + 4); // colour planes
    header.writeUInt16LE(32, entry + 6); // bits per pixel
    header.writeUInt32LE(pngs[i].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += pngs[i].length;
  });
  return new Response(new Uint8Array(Buffer.concat([header, ...pngs])), { headers: { 'Content-Type': 'image/x-icon' } });
};
