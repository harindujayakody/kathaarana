// node scripts/admin/content.test.mjs
import assert from 'node:assert/strict';
import { normaliseBody, parseDoc, planChapter, planStory, SLUG_RE } from './content.mjs';

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

console.log('content rules: all checks passed');
