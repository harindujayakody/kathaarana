// Site-wide behaviour: theme, reading history, and the shared numbers (ratings, likes, views).
// The page uses Astro's client router, so everything that touches the DOM runs from
// `astro:page-load`, which fires on first load and after every in-app navigation.

const API = import.meta.env.PUBLIC_API_BASE ?? '/api';

type NovelStats = { rating: number; ratings: number; likes: number; views: number; week: number };
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

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
const emptyStats = (): NovelStats => ({ rating: 0, ratings: 0, likes: 0, views: 0, week: 0 });

/* ---------- theme ---------- */

function initTheme() {
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.onclick = () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      // Raw string, not JSON: the inline head script reads it before this module loads.
      localStorage.setItem('katha_theme', next);
    };
  });
}

/* ---------- history and library ---------- */

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function historyRow(item: HistoryItem) {
  const a = el('a', 'tap flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-[var(--reader-bg)]');
  a.href = item.url;
  if (item.novelCover) {
    const img = el('img', 'h-12 w-8 shrink-0 rounded object-cover');
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
  a.href = item.url;
  if (item.novelCover) {
    const img = el('img', 'h-20 w-[3.35rem] shrink-0 rounded-md object-cover');
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

function initHistory() {
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

function initVoting() {
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
    node.querySelector<HTMLElement>('[data-metric]')!.textContent = stats ? chart.label(s) : '';
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

document.addEventListener('astro:page-load', () => {
  initTheme();
  initHistory();
  initVoting();
  initChart();
  renderStats();
  loadStats().then(renderStats);
});
