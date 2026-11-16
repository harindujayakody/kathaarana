// Chapter page behaviour: history, view count, reader bar, settings sheet, reactions.
import { navigate } from 'astro:transitions/client';
import { post, type HistoryItem } from './app';

const API = import.meta.env.PUBLIC_API_BASE ?? '/api';

const readJson = <T>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

type Page = { novel: string; chapter: number; title: string; cover: string; author: string; chapterTitle: string };

const currentPage = (): Page | null => {
  const node = document.querySelector<HTMLElement>('[data-chapter-page]');
  if (!node) return null;
  const d = node.dataset;
  return {
    novel: d.novelId!,
    chapter: Number(d.chapter),
    title: d.novelTitle!,
    cover: d.novelCover!,
    author: d.author!,
    chapterTitle: d.chapterTitle!,
  };
};

function recordVisit(page: Page) {
  const entry: HistoryItem = {
    novelId: page.novel,
    novelTitle: page.title,
    novelCover: page.cover,
    author: page.author,
    chapterNumber: page.chapter,
    chapterTitle: page.chapterTitle,
    url: location.pathname,
    readAt: Date.now(),
  };
  const history = readJson<HistoryItem[]>('katha_history', []).filter((h) => h.novelId !== page.novel);
  save('katha_history', [entry, ...history].slice(0, 20));

  const stats = readJson<{ chaptersRead: string[]; novelsRead: string[] }>('katha_stats', { chaptersRead: [], novelsRead: [] });
  const key = `${page.novel}/${page.chapter}`;
  if (!stats.chaptersRead.includes(key)) stats.chaptersRead.push(key);
  if (!stats.novelsRead.includes(page.novel)) stats.novelsRead.push(page.novel);
  save('katha_stats', stats);

  // One view per chapter per day from this device; the server enforces the same rule.
  const day = new Date().toISOString().slice(0, 10);
  const viewed = readJson<{ day: string; keys: string[] }>('katha_viewed', { day, keys: [] });
  if (viewed.day !== day) Object.assign(viewed, { day, keys: [] });
  if (!viewed.keys.includes(key)) {
    viewed.keys.push(key);
    save('katha_viewed', viewed);
    post('/view', { novel: page.novel, chapter: page.chapter }).catch(() => {});
  }
}

function initSettings() {
  const sheet = document.getElementById('reader-sheet') as HTMLDialogElement | null;
  const content = document.getElementById('chapter-content');
  if (!sheet) return;

  document.getElementById('btn-open-settings')!.onclick = () => sheet.showModal();
  document.getElementById('btn-close-sheet')!.onclick = () => sheet.close();
  // Tapping the dimmed area outside the sheet closes it.
  sheet.onclick = (event) => {
    if (event.target === sheet) sheet.close();
  };

  let size = parseFloat(localStorage.getItem('katha_font_size') || '') || 17;
  const setSize = (next: number) => {
    size = Math.min(26, Math.max(14, next));
    localStorage.setItem('katha_font_size', String(size));
    document.documentElement.style.setProperty('--reader-font-size', `${size}px`);
  };
  document.getElementById('btn-font-dec')!.onclick = () => setSize(size - 1);
  document.getElementById('btn-font-inc')!.onclick = () => setSize(size + 1);

  const themeButtons = sheet.querySelectorAll<HTMLButtonElement>('[data-set-theme]');
  const syncTheme = () => {
    const theme = document.documentElement.dataset.theme;
    themeButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setTheme === theme)));
  };
  themeButtons.forEach((btn) => {
    btn.onclick = () => {
      document.documentElement.dataset.theme = btn.dataset.setTheme!;
      localStorage.setItem('katha_theme', btn.dataset.setTheme!);
      syncTheme();
    };
  });
  syncTheme();

  const fontButtons = sheet.querySelectorAll<HTMLButtonElement>('[data-font]');
  const setFont = (font: string) => {
    localStorage.setItem('katha_font_family', font);
    content?.classList.toggle('font-novel-serif', font === 'serif');
    content?.classList.toggle('font-novel-sans', font !== 'serif');
    fontButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.font === font)));
  };
  fontButtons.forEach((btn) => (btn.onclick = () => setFont(btn.dataset.font!)));
  setFont(localStorage.getItem('katha_font_family') === 'serif' ? 'serif' : 'sans');
}

function initBookmark(page: Page) {
  const btn = document.querySelector<HTMLButtonElement>('[data-bookmark]');
  if (!btn) return;
  type Bookmark = HistoryItem & { savedAt: number };
  const same = (b: Bookmark) => b.novelId === page.novel && b.chapterNumber === page.chapter;
  const sync = () => btn.setAttribute('aria-pressed', String(readJson<Bookmark[]>('katha_bookmarks', []).some(same)));

  btn.onclick = () => {
    const bookmarks = readJson<Bookmark[]>('katha_bookmarks', []);
    const index = bookmarks.findIndex(same);
    if (index >= 0) bookmarks.splice(index, 1);
    else
      bookmarks.unshift({
        novelId: page.novel,
        novelTitle: page.title,
        novelCover: page.cover,
        author: page.author,
        chapterNumber: page.chapter,
        chapterTitle: page.chapterTitle,
        url: location.pathname,
        savedAt: Date.now(),
      });
    save('katha_bookmarks', bookmarks);
    sync();
    document.querySelectorAll<HTMLElement>('[data-library-badge]').forEach((badge) => {
      badge.textContent = String(bookmarks.length);
      badge.hidden = bookmarks.length === 0;
    });
  };
  sync();
}

async function initReactions(page: Page) {
  const bar = document.querySelector<HTMLElement>('[data-reactions]');
  if (!bar) return;
  const key = `${page.novel}/${page.chapter}`;
  const counts: Record<string, number> = {};
  const buttons = bar.querySelectorAll<HTMLButtonElement>('[data-kind]');

  const render = () => {
    const mine = readJson<{ r: object; x: Record<string, string> }>('katha_votes', { r: {}, x: {} }).x[key];
    buttons.forEach((btn) => {
      const kind = btn.dataset.kind!;
      btn.setAttribute('aria-pressed', String(mine === kind));
      btn.querySelector<HTMLElement>('[data-count]')!.textContent = String(counts[kind] ?? 0);
    });
  };

  buttons.forEach((btn) => {
    btn.onclick = () => {
      const kind = btn.dataset.kind!;
      const votes = readJson<{ r: object; x: Record<string, string> }>('katha_votes', { r: {}, x: {} });
      const previous = votes.x[key];
      if (previous) counts[previous] = Math.max(0, (counts[previous] ?? 0) - 1);
      if (previous === kind) delete votes.x[key];
      else {
        votes.x[key] = kind;
        counts[kind] = (counts[kind] ?? 0) + 1;
      }
      save('katha_votes', votes);
      render();
      post('/react', { novel: page.novel, chapter: page.chapter, kind: previous === kind ? null : kind }).catch(() => {});
    };
  });

  render();
  try {
    const res = await fetch(`${API}/reactions?novel=${encodeURIComponent(page.novel)}`);
    if (res.ok) Object.assign(counts, (await res.json()).chapters?.[page.chapter] ?? {});
    render();
  } catch {}
}

document.addEventListener('astro:page-load', () => {
  const page = currentPage();
  if (!page) return;
  recordVisit(page);
  initSettings();
  initBookmark(page);
  initReactions(page);
});

// Registered once: the handlers look up the current page's elements each time.
let lastY = 0;
window.addEventListener(
  'scroll',
  () => {
    const bar = document.getElementById('reader-bar');
    if (!bar) return;
    const total = document.documentElement.scrollHeight - innerHeight;
    const progress = document.getElementById('reading-progress-bar');
    if (progress && total > 0) progress.style.width = `${Math.min(100, (scrollY / total) * 100)}%`;
    // Hide the bar while reading down, bring it back on any scroll up or at the end.
    const atEnd = total - scrollY < 80;
    bar.classList.toggle('translate-y-full', scrollY > lastY && scrollY > 200 && !atEnd);
    lastY = scrollY;
  },
  { passive: true },
);

document.addEventListener('keydown', (event) => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  if ((document.getElementById('reader-sheet') as HTMLDialogElement | null)?.open) return;
  const id = event.key === 'ArrowLeft' ? 'btn-prev-chap' : event.key === 'ArrowRight' ? 'btn-next-chap' : null;
  const link = id && (document.getElementById(id) as HTMLAnchorElement | null);
  if (link) navigate(link.href);
});
