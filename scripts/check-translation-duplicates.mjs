#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { findDuplicateKeys } from './lib/translation-validation.mjs';

const FILES = [
  'src/locales/pt/translation.json',
  'src/locales/en/translation.json',
];

let hadDup = false;

function scan(text, file) {
  const dups = findDuplicateKeys(text);
  if (dups.length) {
    hadDup = true;
    console.error(`\n❌ ${file} has duplicate keys (later one silently wins, hiding strings):`);
    for (const d of dups) console.error('   - ' + d);
  } else {
    console.log(`✅ ${file} — no duplicate keys`);
  }
}

for (const f of FILES) scan(readFileSync(f, 'utf8'), f);

if (hadDup) {
  console.error('\nFix: merge the duplicates into a single object. Duplicate top-level keys (e.g. two "admin" blocks) erase entire translation namespaces.\n');
  process.exit(1);
}
