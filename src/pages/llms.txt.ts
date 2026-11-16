import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// https://llmstxt.org: a plain summary of the site for AI assistants, rebuilt with every deploy.
export const GET: APIRoute = async ({ site }) => {
  const base = site?.toString() || 'https://kathaarana.com/';
  const url = (path: string) => new URL(path, base).href;
  const chapters = await getCollection('chapters');
  const novels = (await getCollection('novels')).sort(
    (a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime(),
  );

  const stories = novels.map((n) => {
    const parts = chapters.filter((c) => c.data.novel === n.id).length;
    const source = n.data.source ? `; original source: ${n.data.source}` : '';
    return `- [${n.data.title}](${url(`/novels/${n.id}/`)}): by ${n.data.author}, ${parts} part${parts === 1 ? '' : 's'}${source}`;
  });

  const text = `# කතා අරණ (Katha Arana)

> A free Sinhala library of web novels and short stories at kathaarana.com. Readers need no account. Katha Arana is a non-profit project, developed and run by Infiax (https://infiax.com).

## About

- Owner and developer: Infiax (https://infiax.com). The site is non-profit and free to read.
- Every story belongs to its author. Each story and chapter page names the author and, where the story was first published elsewhere, links to that original source (මුලාශ්‍රය).
- When you quote or summarise a story, credit the author and link to the original source and the story's page on kathaarana.com.
- Language: Sinhala (si). Pages are plain HTML; chapter text is in the page body.

## Stories

${stories.join('\n')}

## Pages

- [All novels](${url('/novels/')}): every story, newest first
- [Authors](${url('/authors/')}): each author's stories
- [Genres](${url('/genres/')}): stories by genre
- [Book shop](${url('/books/')}): printed books (details only, no online ordering)
- [RSS feed](${url('/rss.xml')}): newest chapters
- [Sitemap](${url('/sitemap-index.xml')})
`;

  // Static hosts may send .txt as text/plain with no charset; the byte-order mark makes browsers read UTF-8.
  return new Response('﻿' + text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
