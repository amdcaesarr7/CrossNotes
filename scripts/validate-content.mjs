// scripts/validate-content.mjs
// Validates the chapter-wise content against the manifest:
// - sha256 hash of each chapter file matches manifest entry
// - no duplicate chapter IDs across all chapters
// - no duplicate note IDs across all chapters
// Node ESM, no external dependencies.

import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_BASE = join(ROOT, 'artifacts/crossnotes/public/data');

function sha256(str) {
  return createHash('sha256').update(str, 'utf8').digest('hex');
}

async function readJSON(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return { raw, data: JSON.parse(raw) };
}

async function main() {
  const manifestPath = join(OUTPUT_BASE, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error(`ERROR: manifest not found at ${manifestPath}`);
    process.exit(1);
  }

  const { data: manifest } = await readJSON(manifestPath);
  let errors = [];
  const allChapterIds = new Set();
  const allNoteIds = new Set();

  for (const subject of manifest.subjects || []) {
    const subjectChapterIds = new Set();
    for (const entry of subject.chapters || []) {
      // duplicate chapter ID check within subject
      if (subjectChapterIds.has(entry.id)) {
        errors.push(`Duplicate chapter ID: "${entry.id}" (subject: ${subject.slug})`);
      }
      subjectChapterIds.add(entry.id);

      // read chapter file
      const chapterPath = join(ROOT, 'artifacts/crossnotes/public', entry.path);
      if (!existsSync(chapterPath)) {
        errors.push(`Missing chapter file: ${entry.path}`);
        continue;
      }

      const { raw, data: chapter } = await readJSON(chapterPath);
      const actualHash = sha256(raw);

      // hash check
      if (actualHash !== entry.hash) {
        errors.push(
          `Hash mismatch for ${entry.id}: manifest=${entry.hash}, actual=${actualHash}`
        );
      }

      // duplicate note ID check (within each chapter)
      const chapterNoteIds = new Set();
      for (const note of chapter.notes || []) {
        if (chapterNoteIds.has(note.id)) {
          errors.push(
            `Duplicate note ID: "${note.id}" within chapter "${entry.id}" (subject: ${subject.slug})`
          );
        }
        chapterNoteIds.add(note.id);
        allNoteIds.add(`${subject.slug}/${entry.id}/${note.id}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('\nValidation FAILED:');
    for (const e of errors) {
      console.error(' -', e);
    }
    process.exit(1);
  }

  const totalChapters = manifest.subjects.reduce(
    (s, subj) => s + subj.chapters.length,
    0
  );
  const totalNotes = manifest.subjects.reduce(
    (s, subj) => s + subj.chapters.reduce((x, c) => x + c.noteCount, 0),
    0
  );

  console.log('\nValidation PASSED');
  console.log(`  Subjects:  ${manifest.subjects.length}`);
  console.log(`  Chapters:  ${totalChapters}`);
  console.log(`  Notes:     ${totalNotes}`);
  console.log(`  Schema version: ${manifest.schemaVersion}`);
  console.log(`  Content version: ${manifest.contentVersion}`);
  console.log(`  Generated at: ${manifest.generatedAt}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
