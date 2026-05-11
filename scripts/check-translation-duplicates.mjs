#!/usr/bin/env node
// Fails if any translation JSON has duplicate keys at any nesting level.
// Duplicate keys silently overwrite each other in JSON.parse, hiding huge swaths of strings.
import { readFileSync } from 'node:fs';

const FILES = [
  'src/locales/pt/translation.json',
  'src/locales/en/translation.json',
];

let hadDup = false;

function scan(text, file) {
  // Use a streaming-ish approach via a custom reviver-like parse: we tokenise
  // by walking the AST through JSON.parse with a reviver isn't enough (reviver
  // sees the already-deduped object). Instead, do a manual parse that records
  // every (path, key) pair seen.
  const dups = [];
  let i = 0;
  const n = text.length;

  function skipWs() { while (i < n && /\s/.test(text[i])) i++; }
  function parseString() {
    if (text[i] !== '"') throw new Error('expected string at ' + i);
    let s = ''; i++;
    while (i < n) {
      const c = text[i++];
      if (c === '\\') { s += c + text[i++]; continue; }
      if (c === '"') return JSON.parse('"' + s + '"');
      s += c;
    }
    throw new Error('unterminated string');
  }
  function parseValue(path) {
    skipWs();
    const c = text[i];
    if (c === '{') return parseObject(path);
    if (c === '[') return parseArray(path);
    if (c === '"') { parseString(); return; }
    // number / true / false / null
    while (i < n && !',}]\r\n\t '.includes(text[i])) i++;
  }
  function parseArray(path) {
    i++; // [
    skipWs();
    if (text[i] === ']') { i++; return; }
    let idx = 0;
    while (i < n) {
      parseValue(path + '[' + idx + ']');
      skipWs();
      if (text[i] === ',') { i++; idx++; skipWs(); continue; }
      if (text[i] === ']') { i++; return; }
      throw new Error('bad array at ' + i);
    }
  }
  function parseObject(path) {
    i++; // {
    skipWs();
    const seen = new Set();
    if (text[i] === '}') { i++; return; }
    while (i < n) {
      skipWs();
      const key = parseString();
      const fullPath = path ? path + '.' + key : key;
      if (seen.has(key)) {
        dups.push(fullPath);
      } else {
        seen.add(key);
      }
      skipWs();
      if (text[i] !== ':') throw new Error('expected : at ' + i);
      i++;
      parseValue(fullPath);
      skipWs();
      if (text[i] === ',') { i++; continue; }
      if (text[i] === '}') { i++; return; }
      throw new Error('bad object at ' + i + ' got ' + text[i]);
    }
  }

  parseValue('');

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
