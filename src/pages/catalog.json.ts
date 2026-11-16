import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// The API worker reads this to know which novels and chapters exist before accepting votes.
export const GET: APIRoute = async () => {
  const novels: Record<string, number[]> = {};
  for (const novel of await getCollection('novels')) novels[novel.id] = [];
  for (const chapter of await getCollection('chapters')) novels[chapter.data.novel]?.push(chapter.data.chapterNumber);
  return new Response(JSON.stringify({ novels }), { headers: { 'Content-Type': 'application/json' } });
};
