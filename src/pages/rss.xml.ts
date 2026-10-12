import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async (context) => {
  const chapters = await getCollection('chapters');
  const novels = await getCollection('novels');

  const site = context.site?.toString() || 'https://katha-arana.pages.dev';

  const sortedChapters = chapters.sort(
    (a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime()
  );

  const rssItems = sortedChapters
    .map((ch) => {
      const parent = novels.find((n) => n.id === ch.data.novel);
      const link = `${site}/novels/${ch.data.novel}/${ch.data.chapterNumber}`;
      return `    <item>
      <title><![CDATA[${parent ? parent.data.title + ' - ' : ''}පරිච්ඡේදය ${ch.data.chapterNumber}: ${ch.data.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${ch.data.publishDate.toUTCString()}</pubDate>
      <description><![CDATA[${parent?.data.title || 'කතා අරණ'} හි ${ch.data.chapterNumber} වන පරිච්ඡේදය. කර්තෘ: ${parent?.data.author || ''}. වචන: ${ch.data.wordCount || 850}.]]></description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>කතා අරණ (Katha Arana) - නවතම පරිච්ඡේද</title>
    <description>විවිධ කතුවරුන්ගේ සිංහල නවකතාවල නවතම පරිච්ඡේද</description>
    <link>${site}</link>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>si</language>
${rssItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
