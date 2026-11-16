// Index for the site search (scripts/search.ts): every story, chapter, book and author, built with the site.
// Short keys keep it small: k = kind (n story, c chapter, b book, a author), t = title, s = subtitle,
// u = address, i = thumbnail, x = extra words to match (genres, the English web address).
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { getCollection } from 'astro:content';
import { coverThumbUrl } from '../utils/covers';

type Entry = { k: 'n' | 'c' | 'b' | 'a'; t: string; s: string; u: string; i?: string; x?: string };

export const GET: APIRoute = async () => {
  const novels = await getCollection('novels');
  const chapters = await getCollection('chapters');
  const books = await getCollection('books');
  const entries: Entry[] = [];
  const words = (slug: string, more: string[] = []) => [slug.replace(/-/g, ' '), ...more].join(' ');

  const thumbs = new Map<string, string>();
  for (const n of novels) {
    const i = await coverThumbUrl(n.data.coverImage);
    thumbs.set(n.id, i);
    const parts = chapters.filter((c) => c.data.novel === n.id).length;
    entries.push({ k: 'n', t: n.data.title, s: `${n.data.author} · පරිච්ඡේද ${parts}`, u: `/novels/${n.id}/`, i, x: words(n.id, n.data.genres) });
  }
  for (const c of chapters) {
    const n = novels.find((x) => x.id === c.data.novel);
    if (!n) continue;
    entries.push({ k: 'c', t: c.data.title, s: `${n.data.title} · පරිච්ඡේදය ${c.data.chapterNumber}`, u: `/novels/${n.id}/${c.data.chapterNumber}/`, i: thumbs.get(n.id) });
  }
  for (const b of books) {
    const i = (await getImage({ src: b.data.coverImage, width: 160, format: 'webp' })).src;
    entries.push({ k: 'b', t: b.data.title, s: [b.data.author, b.data.publisher].filter(Boolean).join(' · '), u: `/books/${b.id}/`, i, x: words(b.id, b.data.genres) });
  }
  const authors = new Map<string, { name: string; count: number }>();
  for (const n of novels) {
    const a = authors.get(n.data.authorSlug) ?? { name: n.data.author, count: 0 };
    a.count++;
    authors.set(n.data.authorSlug, a);
  }
  for (const [slug, a] of authors) entries.push({ k: 'a', t: a.name, s: `කතුවරයා · කතා ${a.count}`, u: `/authors/${slug}/` });

  return new Response(JSON.stringify(entries), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
