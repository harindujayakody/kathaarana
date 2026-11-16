import type { APIRoute, GetStaticPaths } from 'astro';
import { brandIconPng } from '../utils/brandIcon';

// Home-screen icons for the web manifest, and the PNG favicon.
export const getStaticPaths = (() => [{ params: { size: '192' } }, { params: { size: '512' } }]) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) =>
  new Response(new Uint8Array(await brandIconPng(Number(params.size))), { headers: { 'Content-Type': 'image/png' } });
