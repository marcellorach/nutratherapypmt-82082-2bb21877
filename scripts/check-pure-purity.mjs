#!/usr/bin/env node
/**
 * Guarda anti-drift: todo arquivo `*.pure.ts` deve ser Node-safe.
 * Falha se:
 *   (a) importar `@/integrations/supabase/client` (ou caminho relativo equivalente), ou
 *   (b) referenciar o identificador `localStorage`.
 *
 * Motivo: os núcleos `.pure` existem para serem importáveis em Node (vitest,
 * SSR) sem jsdom. Qualquer dependência do client Supabase reintroduz o crash
 * `ReferenceError: localStorage is not defined` (ver client.ts auto-gerado).
 * Dependências de I/O ficam no thin wrapper irmão (sem `.pure`).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

const IMPORT_PATTERN = /(?:from|import)\s*['"]([^'"]+)['"]/g;
const LOCALSTORAGE_PATTERN = /\blocalStorage\b/;

function isSupabaseClientImport(spec, file) {
  if (spec === '@/integrations/supabase/client') return true;
  if (spec.startsWith('.')) {
    // resolve relative to the file
    const abs = join(file, '..', spec).replace(/\\/g, '/');
    return abs.endsWith('/src/integrations/supabase/client') ||
           abs.endsWith('/integrations/supabase/client');
  }
  return false;
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules') continue;
      yield* walk(full);
    } else if (entry.endsWith('.pure.ts')) {
      yield full;
    }
  }
}

const checked = [];
const violations = [];

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  checked.push(rel);
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    const stripped = line.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '');
    // (a) supabase client import
    for (const m of stripped.matchAll(IMPORT_PATTERN)) {
      if (isSupabaseClientImport(m[1], file)) {
        violations.push({
          file: rel,
          line: i + 1,
          text: line.trim(),
          reason: `importa o client Supabase ('${m[1]}')`,
        });
      }
    }
    // (b) localStorage reference
    if (LOCALSTORAGE_PATTERN.test(stripped)) {
      violations.push({
        file: rel,
        line: i + 1,
        text: line.trim(),
        reason: 'referencia `localStorage` (indisponível em Node)',
      });
    }
  });
}

if (violations.length > 0) {
  console.error('\n❌ check-pure-purity: núcleo .pure deve ser Node-safe.\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.reason}`);
    console.error(`     ${v.text}`);
  }
  console.error(
    '\nMova a dependência do client Supabase (ou o acesso a localStorage) para o thin wrapper irmão\n' +
      '(arquivo sem sufixo `.pure`). O núcleo `.pure` fica só com math/tipos determinísticos.\n',
  );
  process.exit(1);
}

console.log(`✅ check-pure-purity: ${checked.length} arquivo(s) .pure.ts verificado(s), todos Node-safe:`);
for (const f of checked) console.log(`   - ${f}`);
