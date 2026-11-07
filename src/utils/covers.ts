import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

// Small WebP for places that need a plain URL: reading history, bookmarks.
export const coverThumbUrl = async (src: ImageMetadata) =>
  (await getImage({ src, width: 160, format: 'webp' })).src;

// JPEG for og:image and JSON-LD, which some crawlers won't read as WebP.
export const coverShareUrl = async (src: ImageMetadata) =>
  (await getImage({ src, width: 800, format: 'jpeg' })).src;
