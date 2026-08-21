#!/usr/bin/env node
/**
 * Guarda anti-drift: nenhum .tsx fora de src/hooks/useStudyRichData.ts pode
 * ler `analysis_data.<extract-owned>` direto. O leitor canônico é o hook.
 *
 * Falha o build se encontrar violação. Para CI/local: `npm run check:ownership-reads`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const ALLOWED = new Set([
  join('src', 'hooks', 'useStudyRichData.ts'),
  // núcleo puro do próprio helper oficial
  join('src', 'hooks', 'useStudyRichData.pure.ts'),
]);

const FORBIDDEN_FIELDS = [
  'molecularMechanisms',
  'clinicalOutcomes',
  'hierarchicalRelations',
  'synergies',
  'extractionStages',
  'detailedSideEffects',
];
// matches analysis_data.foo  OR  analysis_data?.foo  OR  analysisData.foo  OR analysisData?.foo
const PATTERN = new RegExp(
  String.raw`\banalysis(?:_d|D)ata\??\.(?:${FORBIDDEN_FIELDS.join('|')})\b`,
);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '__tests__' || entry === 'test') continue;
      yield* walk(full);
    } else if (/\.(tsx|ts)$/.test(entry)) {
      yield full;
    }
  }
}

const violations = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  if (ALLOWED.has(rel)) continue;
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    // ignora comentários puros
    const stripped = line.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '');
    if (PATTERN.test(stripped)) {
      violations.push({ file: rel, line: i + 1, text: line.trim() });
    }
  });
}

if (violations.length > 0) {
  console.error('\n❌ Leitura direta de campos extract-owned em analysis_data fora do hook oficial:\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.text}`);
  }
  console.error(
    '\nUse `useStudyRichData` (src/hooks/useStudyRichData.ts) — ele cobre o fallback de estudos legados ' +
      'cujo Stage 3 está em study_extractions.extracted_data mas não em processed_studies.analysis_data.',
  );
  process.exit(1);
}

console.log('✅ check-ownership-reads: nenhuma leitura direta de extract-owned fora do helper.');