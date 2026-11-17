// Site-wide behaviour: theme, reading history, and the shared numbers (ratings, likes, views, downloads).
// The page uses Astro's client router, so everything that touches the DOM runs from
// `astro:page-load`, which fires on first load and after every in-app navigation.

const API = import.meta.env.PUBLIC_API_BASE ?? '/api';

type NovelStats = { rating: number; ratings: number; likes: number; views: number; downloads: number; week: number };
type Stats = Record<string, NovelStats>;
type Votes = { r: Record<string, number>; x: Record<string, string> };
export type HistoryItem = {
  novelId: string;
  novelTitle: string;
  novelCover: string;
  author?: string;
  chapterNumber: number;
  chapterTitle?: string;
  url: string;
  readAt?: number;
};

const read = <T>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export const deviceId = () => {
  let id = read<string>('katha_device', '');
  if (!id) {
    id = crypto.randomUUID();
    write('katha_device', id);
  }
  return id;
};

const votes = (): Votes => read<Votes>('katha_votes', { r: {}, x: {} });

export const post = (path: string, body: object) =>
  fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, device: deviceId() }),
    keepalive: true,
  });

// Little "it counted" feedback for reactions, likes and ratings (CSS in global.css; skipped for reduced motion).
// Removing and re-adding the class restarts the animation on repeated taps.
const restart = (node: Element | null | undefined, cls: string, delay = 0) => {
  if (!(node instanceof HTMLElement || node instanceof SVGElement)) return;
  node.classList.remove(cls);
  void (node as HTMLElement).getBoundingClientRect();
  node.style.animationDelay = delay ? `${delay}ms` : '';
  node.classList.add(cls);
  setTimeout(() => node.classList.remove(cls), 700 + delay);
};
export const pop = (node: Element | null | undefined, delay = 0) => restart(node, 'kt-pop', delay);
export const burst = (node: Element | null | undefined) => restart(node, 'kt-burst');

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
const emptyStats = (): NovelStats => ({ rating: 0, ratings: 0, likes: 0, views: 0, downloads: 0, week: 0 });

/* ---------- theme ---------- */

// Light is the default. Applies a theme and saves it; choosing light forgets the choice instead,
// so the reader simply follows the default again.
// Raw string, not JSON: the inline head script in BaseLayout reads it before this module loads.
export function setTheme(theme: string) {
  try {
    if (theme === 'light') localStorage.removeItem('katha_theme');
    else localStorage.setItem('katha_theme', theme);
  } catch {}
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (meta) meta.content = theme === 'dark' ? 'dark' : 'light';
}

// Sidebar/header toggle: switch between light and dark.
function initTheme() {
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
}

/* ---------- history and library ---------- */

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// History comes from localStorage, so only links back into this site are used.
const localPath = (url: string) => (url.startsWith('/') && !url.startsWith('//') ? url : '/');

// A cover saved on this device (history, bookmarks, shelves) goes stale when the site rebuilds its pictures
// under new file names. If one fails to load, take the current one from the search index and remember it.
let coverIndex: Promise<Map<string, string>> | null = null;
export function healCover(img: HTMLImageElement, pageUrl: string) {
  img.addEventListener(
    'error',
    async () => {
      const old = img.getAttribute('src');
      coverIndex ??= fetch('/search.json')
        .then((r) => (r.ok ? r.json() : []))
        .then((all: { u: string; i?: string }[]) => new Map(all.filter((e) => e.i && /^\/(novels|books)\/[^/]+\/$/.test(e.u)).map((e) => [e.u, e.i!])))
        .catch(() => new Map());
      const page = /^\/(novels|books)\/[^/]+\//.exec(pageUrl)?.[0];
      const fresh = page ? (await coverIndex).get(page) : undefined;
      if (!fresh || !old || fresh === old) return;
      img.src = fresh;
      for (const key of ['katha_history', 'katha_bookmarks', 'katha_shelves']) {
        try {
          const raw = localStorage.getItem(key);
          if (raw?.includes(old)) localStorage.setItem(key, raw.split(old).join(fresh));
        } catch {}
      }
    },
    { once: true },
  );
}

function historyRow(item: HistoryItem) {
  const a = el('a', 'tap flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-[var(--reader-bg)]');
  a.href = localPath(item.url);
  if (item.novelCover) {
    const img = el('img', 'h-12 w-8 shrink-0 rounded object-cover');
    healCover(img, item.url);
    img.src = item.novelCover;
    img.alt = '';
    img.loading = 'lazy';
    a.append(img);
  }
  const text = el('span', 'min-w-0');
  text.append(
    el('span', 'block truncate text-sm font-medium', item.novelTitle),
    el('span', 'block text-xs text-[var(--reader-muted)]', `පරිච්ඡේදය ${item.chapterNumber}`),
  );
  a.append(text);
  return a;
}

function historyCard(item: HistoryItem) {
  const a = el('a', 'tap surface flex w-[17rem] items-center gap-3 p-3 hover:border-[var(--theme-accent)]');
  a.href = localPath(item.url);
  if (item.novelCover) {
    const img = el('img', 'h-20 w-[3.35rem] shrink-0 rounded-md object-cover');
    healCover(img, item.url);
    img.src = item.novelCover;
    img.alt = '';
    a.append(img);
  }
  const text = el('span', 'min-w-0 flex-1');
  text.append(
    el('span', 'block truncate font-serif font-semibold', item.novelTitle),
    el('span', 'block truncate text-sm text-[var(--reader-muted)]', `පරිච්ඡේදය ${item.chapterNumber}`),
    el('span', 'mt-1.5 block text-sm font-semibold accent-text', 'දිගටම කියවන්න'),
  );
  a.append(text);
  return a;
}

// Also called by the library page after it removes items, so badges and lists stay in step.
export function initHistory() {
  const history = read<HistoryItem[]>('katha_history', []);
  const bookmarks = read<unknown[]>('katha_bookmarks', []);

  document.querySelectorAll<HTMLElement>('[data-library-badge]').forEach((badge) => {
    badge.textContent = String(bookmarks.length);
    badge.hidden = bookmarks.length === 0;
  });

  document.querySelectorAll<HTMLElement>('[data-continue]').forEach((section) => {
    const list = section.querySelector<HTMLElement>('[data-continue-list]');
    if (!list) return;
    const max = Number(section.dataset.continue) || 4;
    const card = section.dataset.continueStyle === 'card';
    list.replaceChildren(...history.slice(0, max).map(card ? historyCard : historyRow));
    section.hidden = history.length === 0;
  });
}

/* ---------- shared numbers ---------- */

let stats: Stats | null = null;
let statsAt = 0;

async function loadStats(): Promise<Stats | null> {
  if (stats && Date.now() - statsAt < 30_000) return stats;
  try {
    const res = await fetch(`${API}/stats`);
    if (!res.ok) return stats;
    stats = (await res.json()).novels as Stats;
    statsAt = Date.now();
  } catch {}
  return stats;
}

function renderStats() {
  const mine = votes();

  document.querySelectorAll<HTMLElement>('[data-stats]').forEach((box) => {
    const s = stats?.[box.dataset.stats!] ?? emptyStats();
    const set = (name: string, text: string) =>
      box.querySelectorAll<HTMLElement>(`[data-s="${name}"]`).forEach((n) => (n.textContent = text));
    set('rating', s.ratings ? s.rating.toFixed(1) : '–');
    set('ratings', s.ratings ? `(${compact(s.ratings)})` : '');
    set('ratings-long', s.ratings ? `ඇගයීම් ${compact(s.ratings)}` : 'තවම ඇගයීම් නැත');
    set('likes', compact(s.likes));
    set('views', compact(s.views));
    set('downloads', compact(s.downloads ?? 0));
  });

  document.querySelectorAll<HTMLButtonElement>('[data-like]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(mine.x[`${btn.dataset.like}/0`] === 'like'));
  });

  document.querySelectorAll<HTMLElement>('[data-rate]').forEach((box) => {
    const stars = mine.r[box.dataset.rate!] ?? 0;
    box.querySelectorAll<HTMLButtonElement>('[data-star]').forEach((btn) => {
      const on = Number(btn.dataset.star) <= stars;
      btn.setAttribute('aria-pressed', String(on));
    });
    const msg = box.querySelector<HTMLElement>('[data-rate-msg]');
    if (msg) msg.textContent = stars ? `ඔබ තරු ${stars}ක් දුන්නා` : 'ඔබේ ඇගයීම දෙන්න';
  });

  renderChart();
}

// WhatsApp on phones: open the share sheet with the story card attached, like shops do.
// The image is fetched up front because share() must run straight from the tap.
// Where files can't be shared (desktop, older phones) the link opens wa.me as usual.
function initShareCards() {
  if (!matchMedia('(pointer: coarse)').matches || !navigator.canShare) return;
  document.querySelectorAll<HTMLAnchorElement>('[data-share-card]').forEach(async (link) => {
    let file: File;
    try {
      const res = await fetch(link.dataset.shareCard!);
      if (!res.ok) return;
      file = new File([await res.blob()], 'kathaarana.jpg', { type: 'image/jpeg' });
      if (!navigator.canShare({ files: [file] })) return;
    } catch {
      return;
    }
    link.onclick = (event) => {
      event.preventDefault();
      navigator.share({ files: [file], text: link.dataset.shareText }).catch((err: DOMException) => {
        if (err.name !== 'AbortError') location.href = link.href;
      });
    };
  });
}

// A book page counts one view per day from this device; the server enforces the same rule.
function initBookView() {
  const key = document.querySelector<HTMLElement>('[data-book-view]')?.dataset.bookView;
  if (!key) return;
  const day = new Date().toISOString().slice(0, 10);
  let viewed: { day: string; keys: string[] } = { day, keys: [] };
  try {
    viewed = JSON.parse(localStorage.getItem('katha_viewed') ?? '') ?? viewed;
  } catch {}
  if (viewed.day !== day) viewed = { day, keys: [] };
  const id = `${key}/1`;
  if (viewed.keys.includes(id)) return;
  viewed.keys.push(id);
  try {
    localStorage.setItem('katha_viewed', JSON.stringify(viewed));
  } catch {}
  post('/view', { novel: key, chapter: 1 }).catch(() => {});
}

function initVoting() {
  // The link still downloads the file; this only counts it (once per device, on the server).
  document.querySelectorAll<HTMLAnchorElement>('[data-download]').forEach((link) => {
    link.onclick = () => {
      post('/download', { novel: link.dataset.download! }).catch(() => {});
    };
  });

  document.querySelectorAll<HTMLButtonElement>('[data-like]').forEach((btn) => {
    btn.onclick = (event) => {
      event.preventDefault();
      const novel = btn.dataset.like!;
      const mine = votes();
      const key = `${novel}/0`;
      const liked = mine.x[key] === 'like';
      if (liked) delete mine.x[key];
      else mine.x[key] = 'like';
      write('katha_votes', mine);
      if (stats) (stats[novel] ??= emptyStats()).likes += liked ? -1 : 1;
      renderStats();
      if (!liked) {
        pop(btn.querySelector('svg'));
        burst(btn);
      }
      post('/react', { novel, chapter: 0, kind: liked ? null : 'like' }).catch(() => {});
    };
  });

  document.querySelectorAll<HTMLElement>('[data-rate]').forEach((box) => {
    const novel = box.dataset.rate!;
    box.querySelectorAll<HTMLButtonElement>('[data-star]').forEach((btn) => {
      btn.onclick = () => {
        const value = Number(btn.dataset.star);
        const mine = votes();
        const previous = mine.r[novel];
        mine.r[novel] = value;
        write('katha_votes', mine);
        if (stats) {
          const s = (stats[novel] ??= emptyStats());
          const total = s.rating * s.ratings - (previous ?? 0) + value;
          if (!previous) s.ratings += 1;
          s.rating = total / s.ratings;
        }
        renderStats();
        // The chosen stars bounce in turn, left to right.
        box.querySelectorAll<HTMLButtonElement>('[data-star]').forEach((star) => {
          const n = Number(star.dataset.star);
          if (n <= value) pop(star.querySelector('svg'), (n - 1) * 60);
        });
        post('/rate', { novel, stars: value }).catch(() => {});
      };
    });
  });
}

/* ---------- top charts ---------- */

const CHARTS: Record<string, { score: (s: NovelStats, mean: number) => number; label: (s: NovelStats) => string }> = {
  trending: { score: (s) => s.week * 1000 + s.views, label: (s) => `මේ සතියේ ප්‍රතිචාර ${compact(s.week)}` },
  // Weighted so one 5-star vote doesn't outrank many 4.8s.
  rated: {
    score: (s, mean) => (s.ratings / (s.ratings + 2)) * s.rating + (2 / (s.ratings + 2)) * mean,
    label: (s) => (s.ratings ? `තරු ${s.rating.toFixed(1)} · ඇගයීම් ${compact(s.ratings)}` : 'තවම ඇගයීම් නැත'),
  },
  liked: { score: (s) => s.likes, label: (s) => `කැමැත්ත ${compact(s.likes)}` },
  viewed: { score: (s) => s.views, label: (s) => `නැරඹුම් ${compact(s.views)}` },
};

let activeChart = 'trending';

function renderChart() {
  const list = document.querySelector<HTMLElement>('[data-chart]');
  if (!list) return;
  const chart = CHARTS[activeChart];
  const all = Object.values(stats ?? {}).filter((s) => s.ratings);
  const mean = all.length ? all.reduce((sum, s) => sum + s.rating, 0) / all.length : 0;

  const items = [...list.querySelectorAll<HTMLElement>('[data-chart-item]')];
  const scored = items.map((node, index) => {
    const s = stats?.[node.dataset.chartItem!] ?? emptyStats();
    return { node, index, s, score: chart.score(s, mean) };
  });
  // Ties keep the page's own order (newest first).
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  // Re-append in ranked order so reading order matches what is shown.
  list.append(...scored.map((x) => x.node));
  scored.forEach(({ node, s }, i) => {
    node.hidden = i >= 5;
    node.querySelector<HTMLElement>('[data-rank]')!.textContent = String(i + 1);
    // Until the numbers arrive the line keeps the author's name, so the list doesn't jump.
    if (stats) node.querySelector<HTMLElement>('[data-metric]')!.textContent = chart.label(s);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-chart-tab]').forEach((tab) => {
    tab.setAttribute('aria-selected', String(tab.dataset.chartTab === activeChart));
  });
}

function initChart() {
  document.querySelectorAll<HTMLButtonElement>('[data-chart-tab]').forEach((tab) => {
    tab.onclick = () => {
      activeChart = tab.dataset.chartTab!;
      renderChart();
    };
  });
}

// Phone header: hide while scrolling down, show on scrolling up, near the top, or once scrolling stops.
// Registered once; it looks up the current page's header each time.
let headerY = 0;
let headerIdle: ReturnType<typeof setTimeout> | undefined;
addEventListener(
  'scroll',
  () => {
    const header = document.getElementById('mobile-header');
    if (!header) return;
    const y = scrollY;
    if (y <= 80 || y < headerY - 4) header.classList.remove('header-hidden');
    else if (y > headerY + 4) header.classList.add('header-hidden');
    headerY = y;
    clearTimeout(headerIdle);
    headerIdle = setTimeout(() => header.classList.remove('header-hidden'), 350);
  },
  { passive: true },
);

document.addEventListener('astro:page-load', () => {
  headerY = scrollY;
  initTheme();
  initHistory();
  initVoting();
  initShareCards();
  initBookView();
  initChart();
  renderStats();
  loadStats().then(renderStats);
});
