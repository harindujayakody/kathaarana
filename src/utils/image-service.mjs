// Astro's sharp image service, plus a small logo watermark for book pictures.
// Ask for it with `watermark: true` on <Image> / getImage(). The logo goes in the bottom-right corner,
// white with a soft shadow so it reads on light and dark covers. Only the generated copies get it:
// the original files in src/assets/books are never changed. Tiny thumbnails (under 200px) are left clean.
import sharpService from 'astro/assets/services/sharp';
import sharp from 'sharp';
import { join } from 'node:path';

// From the project root: at build time this file runs from a bundled copy, so import.meta.url won't do.
const LOGO = join(process.cwd(), 'public/brand/logo.png');
const MIN_WIDTH = 200;
// Part of every watermarked file's name: change it when the watermark's look changes, so cached copies are redone.
const VERSION = 'logo-2';

async function stamp(input) {
  const image = sharp(input).rotate();
  const { width, height } = await image.metadata();
  if (!width || !height) return input;
  // Small and tucked into the corner, clear of most cover text.
  const logoWidth = Math.round(width * 0.15);
  const margin = Math.round(width * 0.025);
  const pad = Math.max(2, Math.round(logoWidth * 0.04));
  const logo = sharp(LOGO).resize({ width: logoWidth }).ensureAlpha();
  const { height: logoHeight } = await logo.clone().toBuffer({ resolveWithObject: true }).then((r) => r.info);
  // The logo file is black on transparent: invert it to white, at 85% strength.
  const white = await logo.clone().negate({ alpha: false }).linear([1, 1, 1, 0.85], [0, 0, 0, 0]).png().toBuffer();
  const shadow = await logo
    .clone()
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .blur(pad / 2)
    .linear([1, 1, 1, 0.45], [0, 0, 0, 0])
    .png()
    .toBuffer();
  const left = width - logoWidth - margin;
  const top = height - logoHeight - margin;
  // Lossless here; Astro then resizes and encodes once, as it does for every other image.
  return image
    .composite([
      { input: shadow, left: left - pad + 1, top: top - pad + 1 },
      { input: white, left, top },
    ])
    .png()
    .toBuffer();
}

/** @type {import('astro').LocalImageService} */
const service = {
  ...sharpService,
  // Same picture with and without the logo must not share a file name.
  // (Astro's own list, from astro/dist/assets/consts.js; the sharp service doesn't export it.)
  propertiesToHash: [...(sharpService.propertiesToHash ?? ['src', 'width', 'height', 'format', 'quality', 'fit', 'position', 'background']), 'watermark'],
  validateOptions(options, config) {
    const checked = sharpService.validateOptions ? sharpService.validateOptions(options, config) : options;
    if (checked.watermark) checked.watermark = VERSION;
    return checked;
  },
  // Dev server: carry the flag through the image URL.
  getURL(options, config) {
    const url = sharpService.getURL(options, config);
    return options.watermark ? `${url}&wm=1` : url;
  },
  parseURL(url, config) {
    const transform = sharpService.parseURL(url, config);
    if (transform && url.searchParams.get('wm') === '1') transform.watermark = true;
    return transform;
  },
  getHTMLAttributes(options, config) {
    const { watermark, ...rest } = options;
    return sharpService.getHTMLAttributes(rest, config);
  },
  async transform(input, transform, config, logger) {
    const tiny = transform.width !== undefined && transform.width < MIN_WIDTH;
    if (!transform.watermark || tiny) return sharpService.transform(input, transform, config, logger);
    // Stamp at full size, then resize: the logo stays the same share of the picture at every width.
    return sharpService.transform(await stamp(input), transform, config, logger);
  },
};

export default service;
