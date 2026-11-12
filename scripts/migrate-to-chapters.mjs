// scripts/migrate-to-chapters.mjs
// Migrates per-subject JSON files into per-chapter JSON files under public/data/
// and writes a manifest.json with hashes and metadata.
// Node ESM, no external dependencies.

import { createHash } from 'crypto';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'artifacts/crossnotes/src/data/content');
const OUTPUT_BASE = join(ROOT, 'artifacts/crossnotes/public/data');

const SLUGS = [
  'history',
  'geography',
  'maths-1',
  'maths-2',
  'science-1',
  'science-2',
  'english',
  'hindi',
  'marathi',
];

const MATHS_SLUGS = new Set(['maths-1', 'maths-2']);

function sha256(str) {
  return createHash('sha256').update(str, 'utf8').digest('hex');
}

function deriveName(slug) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function uniqueNoteTags(chapter) {
  const types = new Set();
  for (const note of chapter.notes || []) {
    if (note.type) types.add(note.type);
  }
  return Array.from(types).sort();
}

async function readJSON(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function main() {
  const generatedAt = new Date().toISOString();

  // --- pass 1: load and validate source data ---
  const subjectData = [];
  let totalNotesBefore = 0;

  for (const slug of SLUGS) {
    const srcPath = join(CONTENT_DIR, `${slug}.json`);
    if (!existsSync(srcPath)) {
      console.error(`ERROR: source file not found: ${srcPath}`);
      process.exit(1);
    }

    const data = await readJSON(srcPath);
    const chapters = data.chapters || [];

    // load and merge solutions for maths slugs
    if (MATHS_SLUGS.has(slug)) {
      const solPath = join(CONTENT_DIR, `${slug}-original-solutions.json`);
      if (existsSync(solPath)) {
        const solutions = await readJSON(solPath);
        for (const chapter of chapters) {
          for (const note of chapter.notes || []) {
            if (solutions[note.id] !== undefined) {
              note.solutionPages = solutions[note.id];
            }
          }
        }
      }
    }

    // validate no duplicate chapter IDs within this subject
    const subjectChapterIds = new Set();
    for (const chapter of chapters) {
      if (subjectChapterIds.has(chapter.id)) {
        console.error(`ERROR: duplicate chapter ID "${chapter.id}" in slug "${slug}"`);
        process.exit(1);
      }
      subjectChapterIds.add(chapter.id);
    }

    // validate no duplicate note IDs within each chapter
    for (const chapter of chapters) {
      const chapterNoteIds = new Set();
      for (const note of chapter.notes || []) {
        if (chapterNoteIds.has(note.id)) {
          console.error(
            `ERROR: duplicate note ID "${note.id}" in chapter "${chapter.id}" of subject "${slug}"`
          );
          process.exit(1);
        }
        chapterNoteIds.add(note.id);
        totalNotesBefore++;
      }
    }

    subjectData.push({ slug, chapters });
  }

  // --- pass 2: write chapter files and build manifest ---
  const manifestSubjects = [];
  let totalNotesAfter = 0;
  const allChapterHashes = [];

  for (const { slug, chapters } of subjectData) {
    const subjectDir = join(OUTPUT_BASE, slug);
    await ensureDir(subjectDir);

    const manifestChapters = [];

    for (const chapter of chapters) {
      const chapterJson = JSON.stringify(chapter, null, 2);
      const chapterHash = sha256(chapterJson);
      const chapterBytes = Buffer.byteLength(chapterJson, 'utf8');
      const outPath = join(subjectDir, `${chapter.id}.json`);

      await writeFile(outPath, chapterJson, 'utf8');
      allChapterHashes.push(chapterHash);

      const noteCount = (chapter.notes || []).length;
      const flashcardCount = (chapter.flashcards || []).length;
      const quizCount = (chapter.quiz || []).length;

      totalNotesAfter += noteCount;

      manifestChapters.push({
        id: chapter.id,
        num: chapter.num,
        title: chapter.title,
        order: chapter.num,
        path: `/data/${slug}/${chapter.id}.json`,
        size: chapterBytes,
        hash: chapterHash,
        updatedAt: generatedAt,
        tags: uniqueNoteTags(chapter),
        noteCount,
        flashcardCount,
        quizCount,
      });
    }

    manifestSubjects.push({
      slug,
      name: deriveName(slug),
      chapters: manifestChapters,
    });
  }

  // --- validate note count consistency ---
  if (totalNotesBefore !== totalNotesAfter) {
    console.error(
      `ERROR: note count mismatch — before: ${totalNotesBefore}, after: ${totalNotesAfter}`
    );
    process.exit(1);
  }

  // --- write manifest ---
  const contentVersionInput = allChapterHashes.join('\n');
  const contentVersion = sha256(contentVersionInput).slice(0, 12);

  const manifest = {
    schemaVersion: 1,
    contentVersion,
    generatedAt,
    subjects: manifestSubjects,
  };

  await ensureDir(OUTPUT_BASE);
  await writeFile(
    join(OUTPUT_BASE, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  // --- print summary table ---
  console.log('\nMigration complete.\n');
  console.log(
    'Subject          Chapters  Notes  Flashcards  Quizzes'
  );
  console.log(
    '-'.repeat(55)
  );
  for (const subj of manifestSubjects) {
    const totalNotes = subj.chapters.reduce((s, c) => s + c.noteCount, 0);
    const totalFlash = subj.chapters.reduce((s, c) => s + c.flashcardCount, 0);
    const totalQuiz = subj.chapters.reduce((s, c) => s + c.quizCount, 0);
    const name = subj.slug.padEnd(16);
    const ch = String(subj.chapters.length).padStart(8);
    const n = String(totalNotes).padStart(6);
    const f = String(totalFlash).padStart(11);
    const q = String(totalQuiz).padStart(8);
    console.log(`${name}${ch}  ${n}${f}${q}`);
  }
  console.log('-'.repeat(55));

  const grandTotal = manifestSubjects.reduce(
    (acc, s) => {
      acc.chapters += s.chapters.length;
      acc.notes += s.chapters.reduce((x, c) => x + c.noteCount, 0);
      acc.flash += s.chapters.reduce((x, c) => x + c.flashcardCount, 0);
      acc.quiz += s.chapters.reduce((x, c) => x + c.quizCount, 0);
      return acc;
    },
    { chapters: 0, notes: 0, flash: 0, quiz: 0 }
  );

  console.log(
    `${'TOTAL'.padEnd(16)}${String(grandTotal.chapters).padStart(8)}  ${String(grandTotal.notes).padStart(6)}${String(grandTotal.flash).padStart(11)}${String(grandTotal.quiz).padStart(8)}`
  );
  console.log('\nManifest written to:', join(OUTPUT_BASE, 'manifest.json'));
  console.log('contentVersion:', contentVersion);
  console.log('Note count check passed:', totalNotesBefore, '===', totalNotesAfter);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
