import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import sharp from 'sharp';

// 1200x630 share cards: covers on a blurred, darkened copy of the first cover.
// No text on purpose: the CI image has no Sinhala font, and og:title carries the name.
const W = 1200;
const H = 630;
const COVER_H = 498;
const COVER_W = 332;
const GAP = 48;

async function shareCard(coverPaths: string[]) {
  const background = await sharp(coverPaths[0])
    .resize(W, H, { fit: 'cover' })
    .blur(40)
    .modulate({ brightness: 0.5 })
    .toBuffer();

  const totalWidth = coverPaths.length * COVER_W + (coverPaths.length - 1) * GAP;
  const left = Math.round((W - totalWidth) / 2);
  const top = Math.round((H - COVER_H) / 2);
  const covers = await Promise.all(
    coverPaths.map(async (p, i) => ({
      input: await sharp(p).resize(COVER_W, COVER_H, { fit: 'cover' }).toBuffer(),
      left: left + i * (COVER_W + GAP),
      top,
    })),
  );

  return sharp(background).composite(covers).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
}

export const getStaticPaths = (async () => {
  const novels = (await getCollection('novels')).sort(
    (a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime(),
  );
  const getCoverPath = (img: unknown) => (img as { fsPath: string }).fsPath;
  return [
    { params: { slug: 'site' }, props: { covers: novels.slice(0, 3).map((n) => getCoverPath(n.data.coverImage)) } },
    ...novels.map((n) => ({ params: { slug: n.id }, props: { covers: [getCoverPath(n.data.coverImage)] } })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const image = await shareCard(props.covers as string[]);
  return new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/jpeg' } });
};
