// Book shelves (wishlist and library), kept on this device like reading history and bookmarks.
// Used by the book page (components/ShelfButton.astro) and the library page (pages/bookmarks.astro).

export const SHELVES = [
  { id: 'reading', si: 'කියවමින් පවතී', en: 'Currently Reading' },
  { id: 'want', si: 'කියවීමට කැමති', en: 'Want to Read' },
  { id: 'finished', si: 'කියවා අවසන්', en: 'Finished Reading' },
  { id: 'owned', si: 'මගේ එකතුවේ ඇත', en: 'On My Shelf' },
] as const;

export type ShelfId = (typeof SHELVES)[number]['id'];
export type ShelfBook = { id: string; title: string; author: string; cover: string; url: string; shelf: ShelfId; savedAt: number };

const KEY = 'katha_shelves';
const isShelf = (s: unknown): s is ShelfId => SHELVES.some((x) => x.id === s);

export function readShelves(): Record<string, ShelfBook> {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!all || typeof all !== 'object') return {};
    // Drop anything malformed, so a bad entry can't break the library page.
    return Object.fromEntries(Object.entries(all).filter(([, b]) => b && typeof b === 'object' && isShelf((b as ShelfBook).shelf))) as Record<string, ShelfBook>;
  } catch {
    return {};
  }
}

/** Puts a book on a shelf, or takes it off with `null`. */
export function setShelf(book: Omit<ShelfBook, 'shelf' | 'savedAt'>, shelf: ShelfId | null) {
  const all = readShelves();
  if (shelf) all[book.id] = { ...book, shelf, savedAt: Date.now() };
  else delete all[book.id];
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

export const shelfName = (id: ShelfId) => SHELVES.find((s) => s.id === id)!.si;
