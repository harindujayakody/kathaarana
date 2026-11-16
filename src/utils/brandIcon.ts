import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

// Every favicon and app icon is made from this one square image.
const SOURCE = join(process.cwd(), 'src/assets/brand/icon.png');

export const brandIconPng = async (size: number) =>
  sharp(await readFile(SOURCE)).resize(size, size, { fit: 'cover' }).png().toBuffer();
