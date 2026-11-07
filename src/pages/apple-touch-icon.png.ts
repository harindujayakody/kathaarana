import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

// iOS ignores SVG icons; render the favicon to the 180x180 PNG it expects.
export const GET: APIRoute = async () => {
  const svg = await readFile(join(process.cwd(), 'public/favicon.svg'));
  const png = await sharp(svg, { density: 600 }).resize(180, 180).flatten({ background: '#059669' }).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
