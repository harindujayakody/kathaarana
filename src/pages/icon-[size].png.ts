import type { APIRoute, GetStaticPaths } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

// Home-screen icons for the web manifest, rendered from the favicon.
export const getStaticPaths = (() => [{ params: { size: '192' } }, { params: { size: '512' } }]) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const size = Number(params.size);
  const svg = await readFile(join(process.cwd(), 'public/favicon.svg'));
  const png = await sharp(svg, { density: 900 }).resize(size, size).flatten({ background: '#059669' }).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
