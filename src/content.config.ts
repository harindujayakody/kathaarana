import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const novels = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/novels' }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string().optional(),
    author: z.string(),
    authorSlug: z.string(),
    synopsis: z.string(),
    coverImage: z.string(),
    genres: z.array(z.string()),
    status: z.enum(['Ongoing', 'Completed']).default('Ongoing'),
    language: z.string().default('si'),
    publishDate: z.coerce.date(),
  }),
});

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/chapters' }),
  schema: z.object({
    novel: z.string(),
    chapterNumber: z.number(),
    title: z.string(),
    publishDate: z.coerce.date(),
    wordCount: z.number().optional(),
  }),
});

export const collections = { novels, chapters };
