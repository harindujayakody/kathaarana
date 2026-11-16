import type { APIRoute } from 'astro';
import { brandIconPng } from '../utils/brandIcon';

// The icon iOS uses for "Add to Home Screen".
export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await brandIconPng(180)), { headers: { 'Content-Type': 'image/png' } });
