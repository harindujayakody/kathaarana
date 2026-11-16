import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Address for an author's page when the novel doesn't give one: the name itself, with hyphens for spaces.
// Sinhala letters stay as they are; the Cf class keeps the invisible joiner many Sinhala letters contain.
const slugFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{M}\p{N}\p{Cf}-]/gu, '');

const novels = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/novels' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        titleEn: z.string().optional(),
        author: z.string(),
        // Optional: filled in from the author's name, so the author page needs no extra field.
        authorSlug: z.string().optional(),
        // Where the story comes from (මුලාශ්‍රය): original work, a translation, a website, a person.
        source: z.string().optional(),
        synopsis: z.string(),
        coverImage: image(),
        genres: z.array(z.string()).default([]),
        status: z.enum(['Ongoing', 'Completed']).default('Ongoing'),
        language: z.string().default('si'),
        publishDate: z.coerce.date(),
      })
      .transform((novel) => ({ ...novel, authorSlug: novel.authorSlug ?? slugFromName(novel.author) })),
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

// Printed books for the book shop. Shown only; there is no online ordering yet.
// The text under the front matter is "About this book".
const books = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/books' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      author: z.string(),
      publisher: z.string().optional(),
      coverImage: image(),
      isbn: z.string().optional(),
      pages: z.number().int().positive().optional(),
      print: z.string().optional(), // e.g. in print, out of print, new edition
      binding: z.string().optional(), // e.g. paperback, hardcover
      addedDate: z.coerce.date().optional(), // newest first on the shop page
    }),
});

export const collections = { novels, chapters, books };
