import type { CollectionEntry } from 'astro:content';

// Words in a chapter: the file's wordCount if given, otherwise counted from the text.
// Markdown marks (*, #, >, scene-break lines) are dropped first so they don't count as words.
export const chapterWords = (chapter: CollectionEntry<'chapters'>) =>
  chapter.data.wordCount ??
  (chapter.body ?? '')
    .replace(/[#>*_`~[\]()|-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
