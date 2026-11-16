// node scripts/admin/content.test.mjs
import assert from 'node:assert/strict';
import { listBooks, normaliseBody, parseDoc, planBook, planChapter, planStory, readBook, SLUG_RE } from './content.mjs';

const doc = parseDoc('---\ntitle: "අ \\"x\\" #1"\ngenres: ["ආ", "ඇ"]\nchapterNumber: 3\npublishDate: 2026-11-16 # note\n---\n\nබ\n');
assert.deepEqual(doc, { data: { title: 'අ "x" #1', genres: ['ආ', 'ඇ'], chapterNumber: 3, publishDate: '2026-11-16' }, body: 'බ' });
assert.equal(normaliseBody('a\n\n b \nc', true), 'a\n\nb\n\nc');
assert.ok(!SLUG_RE.test('Bad Slug') && SLUG_RE.test('good-slug-2'));

const novel = '---\ntitle: "පරණ"\ntitleEn: "Old"\nauthor: "අ"\nsynopsis: "ස"\ncoverImage: "../../assets/covers/old.jpg"\ngenres: ["ආ", "ඇ"]\nstatus: "Ongoing"\npublishDate: 2026-10-10\n---\n';
const snap = { novels: { old: novel }, chapters: { old: { 'chapter-01.md': '---\nnovel: "old"\nchapterNumber: 1\ntitle: "එක"\npublishDate: 2026-10-10\n---\n\nx\n' } }, genresTs: '' };
const same = { isNew: false, slug: 'old', title: 'පරණ', author: 'අ', source: '', synopsis: 'ස', publishDate: '2026-10-10', completed: false, genres: ['ආ', 'ඇ'] };

// Saving unchanged writes the file back exactly, keeping fields the form doesn't show.
const { files } = await planStory(snap, same, { cover: null, coverExists: () => true });
assert.equal(files[0].content, novel);

// A new story with a cover and a first chapter: three files.
const made = await planStory(snap, { ...same, isNew: true, slug: 'new-one', firstChapter: { title: 'පළමු', body: 'අ\nආ' } }, { cover: { bytes: new Uint8Array([1]) }, coverExists: () => false });
assert.deepEqual(made.files.map((f) => f.path), ['src/assets/covers/new-one.jpg', 'src/content/novels/new-one.md', 'src/content/chapters/new-one/01.md']);
assert.match(made.files[2].content, /\n\nඅ\n\nආ\n$/);

// Existing chapters keep their file name; duplicates and unknown stories are refused.
assert.equal(planChapter(snap, { novel: 'old', chapterNumber: 1, title: 'එක', publishDate: '2026-10-10', body: 'y' })[0].path, 'src/content/chapters/old/chapter-01.md');
assert.throws(() => planChapter(snap, { isNew: true, novel: 'old', chapterNumber: 1, title: 't', publishDate: '2026-10-10', body: 'y' }), /already exists/);
assert.throws(() => planChapter(snap, { novel: 'nope', chapterNumber: 1, title: 't', publishDate: '2026-10-10', body: 'y' }), /Story not found/);
await assert.rejects(planStory(snap, { ...same, isNew: true }, { cover: null, coverExists: () => true }), /already exists/);

// Names of built-in object properties are not stories.
assert.throws(() => planChapter(snap, { novel: 'constructor', chapterNumber: 1, title: 't', publishDate: '2026-10-10', body: 'y' }), /Story not found/);
await assert.rejects(planStory(snap, { ...same, slug: 'constructor' }, { cover: null, coverExists: () => true }), /Story not found/);

// Pasted HTML can't run on the site.
assert.equal(normaliseBody('<script>alert(1)</script> <3', true), '&lt;script>alert(1)&lt;/script> &lt;3');

// Books: a new book is a cover plus a file; an unchanged edit writes the same file back; bad input is refused.
const noBooks = { novels: {}, chapters: {}, books: {} };
const newBook = planBook(noBooks, { isNew: true, slug: 'my-book', title: 'පොත', author: 'අ', publisher: 'ප', pages: '240', addedDate: '2026-11-16', about: 'එක\nදෙක <b>' }, { cover: { bytes: new Uint8Array([1]) } });
assert.deepEqual(newBook.files.map((f) => f.path), ['src/assets/books/my-book.jpg', 'src/content/books/my-book.md']);
const bookMd = newBook.files[1].content;
assert.equal(bookMd, '---\ntitle: "පොත"\nauthor: "අ"\npublisher: "ප"\ncoverImage: "../../assets/books/my-book.jpg"\npages: 240\naddedDate: 2026-11-16\n---\n\nඑක\n\nදෙක &lt;b>\n');
const withBook = { ...noBooks, books: { 'my-book': bookMd } };
assert.equal(listBooks(withBook)[0].title, 'පොත');
const stored = readBook(withBook, 'my-book');
const sameBook = planBook(withBook, { isNew: false, slug: 'my-book', title: 'පොත', author: 'අ', publisher: 'ප', pages: stored.data.pages, addedDate: stored.data.addedDate, about: stored.body, linesAreParagraphs: false }, { cover: null });
assert.equal(sameBook.files.length, 1);
assert.equal(sameBook.files[0].content, bookMd);
assert.throws(() => planBook(withBook, { isNew: true, slug: 'my-book', title: 't', author: 'a' }, { cover: null }), /already exists/);
assert.throws(() => planBook(noBooks, { isNew: true, slug: 'x', title: 't', author: 'a', pages: '2.5' }, { cover: { bytes: new Uint8Array() } }), /whole number/);
assert.throws(() => planBook(noBooks, { isNew: true, slug: 'x', title: 't', author: 'a' }, { cover: null }), /cover image/);
assert.throws(() => readBook(withBook, 'constructor'), /Book not found/);

// Genre and price: written after the cover; price accepts "1,250.50", refuses 3 decimals or text.
const priced = planBook(noBooks, { isNew: true, slug: 'priced', title: 't', author: 'a', genres: ['නවකතා', ' '], price: '1,250.50' }, { cover: { bytes: new Uint8Array() } });
assert.match(priced.files[1].content, /coverImage: "\.\.\/\.\.\/assets\/books\/priced\.jpg"\ngenres: \["නවකතා"\]\nprice: 1250\.5\n/);
// A decimal price reads back as a number, so saving the book unchanged writes it unquoted again.
const pricedSnap = { ...noBooks, books: { priced: priced.files[1].content } };
assert.equal(readBook(pricedSnap, 'priced').data.price, 1250.5);
const pricedAgain = planBook(pricedSnap, { isNew: false, slug: 'priced', title: 't', author: 'a', genres: ['නවකතා'], price: readBook(pricedSnap, 'priced').data.price }, { cover: null });
assert.equal(pricedAgain.files[0].content, priced.files[1].content);
assert.throws(() => planBook(noBooks, { isNew: true, slug: 'p2', title: 't', author: 'a', price: '12.345' }, { cover: { bytes: new Uint8Array() } }), /Price must be/);
assert.throws(() => planBook(noBooks, { isNew: true, slug: 'p3', title: 't', author: 'a', price: 'free' }, { cover: { bytes: new Uint8Array() } }), /Price must be/);

console.log('content rules: all checks passed');
