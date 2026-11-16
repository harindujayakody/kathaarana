import type { APIRoute } from 'astro';

// Lets readers add the site to their home screen, where it opens like an app.
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: 'කතා අරණ - සිංහල නවකතා',
      short_name: 'කතා අරණ',
      description: 'සිංහල නවකතා පරිච්ඡේදයෙන් පරිච්ඡේදය නොමිලේ කියවන්න.',
      lang: 'si',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#ffffff',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
