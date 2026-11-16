// Site search. The index (/search.json) is fetched the first time search opens, then every keystroke
// searches it in the browser: instant, no server. With an empty box, or nothing found, it suggests
// a few random stories and books.

type Entry = { k: 'n' | 'c' | 'b' | 'a'; t: string; s: string; u: string; i?: string; x?: string };
type Hit = Entry & { score: number };

const KIND_LABEL: Record<Entry['k'], string> = { n: 'කතාව', c: 'පරිච්ඡේදය', b: 'පොත', a: 'කතුවරයා' };
// Stories and books first, then authors, then single chapters.
const KIND_WEIGHT: Record<Entry['k'], number> = { n: 12, b: 12, a: 6, c: 0 };
const MAX_RESULTS = 8;
const SUGGESTIONS = 3;

let index: Promise<Entry[]> | null = null;
const loadIndex = () =>
  (index ??= fetch('/search.json')
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => {
      index = null; // try again next time
      return [];
    }));

// Lower case, one form of each letter, no invisible joiners, so typing matches what's shown.
const norm = (s: string) => s.normalize('NFC').toLowerCase().replace(/[‌‍]/g, '').replace(/\s+/g, ' ').trim();

function search(entries: Entry[], query: string): { hits: Hit[]; similar: boolean } {
  const q = norm(query);
  const tokens = q.split(' ').filter(Boolean);
  const scored = (requireAll: boolean) =>
    entries
      .map((e): Hit | null => {
        const title = norm(e.t);
        const hay = `${title} ${norm(e.s)} ${norm(e.x ?? '')}`;
        const found = tokens.filter((t) => hay.includes(t)).length;
        if (requireAll ? found < tokens.length : found === 0) return null;
        let score = found * 5 + KIND_WEIGHT[e.k];
        if (title.startsWith(q)) score += 100;
        else if (title.includes(q)) score += 60;
        else if (tokens.every((t) => title.includes(t))) score += 40;
        return { ...e, score };
      })
      .filter((h): h is Hit => h !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);
  const exact = scored(true);
  // Nothing has every word: show what matches any of them, as "similar".
  if (exact.length || tokens.length < 2) return { hits: exact, similar: false };
  return { hits: scored(false), similar: true };
}

function suggestions(entries: Entry[]): Entry[] {
  const pool = entries.filter((e) => e.k === 'n' || e.k === 'b');
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, SUGGESTIONS);
}

// Title with the typed words in bold; built from text nodes, so titles can't inject markup.
function highlighted(text: string, tokens: string[]) {
  const span = document.createElement('span');
  const lower = text.toLowerCase();
  const marks: [number, number][] = [];
  for (const t of tokens) {
    const at = lower.indexOf(t);
    if (at >= 0) marks.push([at, at + t.length]);
  }
  marks.sort((a, b) => a[0] - b[0]);
  let pos = 0;
  for (const [start, end] of marks) {
    if (start < pos) continue;
    span.append(text.slice(pos, start));
    const b = document.createElement('mark');
    b.className = 'bg-transparent font-bold text-[var(--reader-text)]';
    b.textContent = text.slice(start, end);
    span.append(b);
    pos = end;
  }
  span.append(text.slice(pos));
  return span;
}

let active = -1;
let lastQuery = '';

function render(list: Entry[], tokens: string[], heading: string, empty = '') {
  const ul = document.getElementById('search-results')!;
  const input = document.getElementById('search-input') as HTMLInputElement;
  document.getElementById('search-heading')!.textContent = heading;
  const emptyEl = document.getElementById('search-empty')!;
  emptyEl.hidden = !empty;
  emptyEl.textContent = empty;
  active = list.length ? 0 : -1;
  ul.replaceChildren(
    ...list.map((e, n) => {
      const li = document.createElement('li');
      li.id = `search-option-${n}`;
      li.setAttribute('role', 'option');
      const a = document.createElement('a');
      a.href = e.u;
      a.className = 'search-item flex items-center gap-3 rounded-lg px-3 py-2';
      if (e.i) {
        const img = document.createElement('img');
        img.src = e.i;
        img.alt = '';
        img.loading = 'lazy';
        img.className = 'h-12 w-8 shrink-0 rounded object-cover';
        a.append(img);
      } else {
        const ph = document.createElement('span');
        ph.className = 'grid h-12 w-8 shrink-0 place-items-center rounded bg-[var(--reader-bg)] text-sm font-bold text-[var(--reader-muted)]';
        ph.textContent = e.t.charAt(0);
        a.append(ph);
      }
      const text = document.createElement('span');
      text.className = 'min-w-0 flex-1';
      const title = highlighted(e.t, tokens);
      title.className = 'block truncate font-medium';
      const sub = document.createElement('span');
      sub.className = 'block truncate text-sm text-[var(--reader-muted)]';
      sub.textContent = e.s;
      text.append(title, sub);
      const kind = document.createElement('span');
      kind.className = 'shrink-0 rounded-full border border-[var(--reader-border)] px-2 py-0.5 text-xs text-[var(--reader-muted)]';
      kind.textContent = KIND_LABEL[e.k];
      a.append(text, kind);
      li.append(a);
      return li;
    }),
  );
  markActive();
  input.setAttribute('aria-expanded', String(list.length > 0));
}

function markActive() {
  const items = [...document.querySelectorAll<HTMLElement>('#search-results [role="option"]')];
  items.forEach((li, n) => li.setAttribute('aria-selected', String(n === active)));
  const input = document.getElementById('search-input');
  if (active >= 0) {
    input?.setAttribute('aria-activedescendant', `search-option-${active}`);
    items[active]?.scrollIntoView({ block: 'nearest' });
  } else input?.removeAttribute('aria-activedescendant');
}

async function update() {
  const input = document.getElementById('search-input') as HTMLInputElement | null;
  if (!input) return;
  const query = input.value;
  lastQuery = query;
  const entries = await loadIndex();
  if (query !== lastQuery) return; // a newer keystroke is already being handled
  const q = norm(query);
  if (!q) return render(suggestions(entries), [], 'ඔබට කැමති විය හැකි');
  const { hits, similar } = search(entries, query);
  const tokens = q.split(' ').filter(Boolean);
  if (!hits.length) return render(suggestions(entries), [], 'ඔබට කැමති විය හැකි', `“${query.trim()}” සඳහා ප්‍රතිඵල නැත`);
  render(hits, tokens, similar ? 'සමාන ප්‍රතිඵල' : 'ප්‍රතිඵල');
}

function openSearch() {
  const dialog = document.getElementById('search-dialog') as HTMLDialogElement | null;
  if (!dialog || dialog.open) return;
  dialog.showModal();
  const input = document.getElementById('search-input') as HTMLInputElement;
  input.select();
  update();
}
const closeSearch = () => (document.getElementById('search-dialog') as HTMLDialogElement | null)?.close();

// Registered once; the elements are looked up each time, since in-app navigation swaps the page.
document.addEventListener('click', (e) => {
  const target = e.target as Element;
  if (target.closest('[data-search-open]')) openSearch();
  else if (target.closest('[data-search-close]')) closeSearch();
  else if (target.closest('#search-results a')) closeSearch(); // the link navigates; just close the box
});

document.addEventListener('input', (e) => {
  if ((e.target as Element).id === 'search-input') update();
});

document.addEventListener('keydown', (e) => {
  const typing = (e.target as Element).closest?.('input, textarea, select, [contenteditable="true"]');
  if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
    e.preventDefault();
    openSearch();
    return;
  }
  if ((e.target as Element).id !== 'search-input') return;
  const count = document.querySelectorAll('#search-results [role="option"]').length;
  if (e.key === 'ArrowDown' && count) {
    e.preventDefault();
    active = (active + 1) % count;
    markActive();
  } else if (e.key === 'ArrowUp' && count) {
    e.preventDefault();
    active = (active - 1 + count) % count;
    markActive();
  } else if (e.key === 'Enter' && active >= 0) {
    e.preventDefault();
    document.querySelector<HTMLAnchorElement>(`#search-option-${active} a`)?.click();
  }
});
