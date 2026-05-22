/**
 * import-canonical-ids.ts
 *
 * Reads OMIA + MeSH + ChEBI dumps from ~/senex-papers/ (override via env DUMP_DIR)
 * and populates `canonical_id` + `canonical_source` on:
 *   - public.health_conditions  (priority: OMIA → MeSH)
 *   - public.nutraceuticals     (priority: ChEBI → MeSH)
 *
 * Matching:
 *   - Lowercased exact match on name and name_en (English first).
 *   - Skips rows that already have a canonical_id (idempotent).
 *
 * Pre-reqs in .env.local at project root:
 *   SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Usage:
 *   npx tsx scripts/import-canonical-ids.ts
 *   npx tsx scripts/import-canonical-ids.ts --dry-run
 */
import 'dotenv/config';
import * as path from 'node:path';
import * as os from 'node:os';
import { createClient } from '@supabase/supabase-js';
import { parseChebiObo } from './parsers/chebi-obo';
import { parseMeshXml } from './parsers/mesh-xml';
import { parseOmiaXmlGz } from './parsers/omia-xml';

const DRY = process.argv.includes('--dry-run');
const DUMP_DIR = process.env.DUMP_DIR
  ? path.resolve(process.env.DUMP_DIR)
  : path.join(os.homedir(), 'senex-papers');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Faltam variáveis. Crie um arquivo .env.local na raiz do projeto com:\n' +
      '  SUPABASE_URL=https://kytkpkimzwazhpnxahxt.supabase.co\n' +
      '  SUPABASE_SERVICE_ROLE_KEY=<cole do painel Lovable Cloud → Settings>\n',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function norm(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = s.trim().toLowerCase();
  return t.length ? t : null;
}

function lookup(
  indices: Array<{ source: string; map: Map<string, string> }>,
  candidates: (string | null)[],
): { canonical_id: string; canonical_source: string } | null {
  for (const cand of candidates) {
    if (!cand) continue;
    for (const idx of indices) {
      const hit = idx.map.get(cand);
      if (hit) return { canonical_id: hit, canonical_source: idx.source };
    }
  }
  return null;
}

async function main() {
  console.log(`📂 DUMP_DIR = ${DUMP_DIR}`);
  console.log(`🔧 mode    = ${DRY ? 'DRY RUN (sem gravar)' : 'WRITE'}`);
  console.log('');

  console.log('⏳ ChEBI OBO…');
  const chebi = await parseChebiObo(path.join(DUMP_DIR, 'chebi.obo'));
  console.log(`   ✓ ${chebi.total} termos, ${chebi.byName.size} chaves de nome/sinônimo`);

  console.log('⏳ MeSH desc2026.xml (apenas trees C/D)…');
  const mesh = await parseMeshXml(path.join(DUMP_DIR, 'desc2026.xml'));
  console.log(`   ✓ ${mesh.total} descritores, ${mesh.byName.size} chaves`);

  console.log('⏳ OMIA omia.xml.gz (apenas Canis 9615)…');
  const omia = await parseOmiaXmlGz(path.join(DUMP_DIR, 'omia.xml.gz'));
  console.log(`   ✓ ${omia.total} phenes caninas, ${omia.byName.size} chaves`);
  console.log('');

  // -- health_conditions ------------------------------------------------------
  const conditionIndices = [
    { source: 'omia', map: omia.byName },
    { source: 'mesh', map: mesh.byName },
  ];

  const { data: conditions, error: condErr } = await supabase
    .from('health_conditions')
    .select('id, name, name_en, canonical_id')
    .is('canonical_id', null);
  if (condErr) throw condErr;
  console.log(`🩺 health_conditions sem canonical_id: ${conditions?.length ?? 0}`);

  let condMatched = 0;
  const condUnmatched: string[] = [];
  for (const row of conditions ?? []) {
    const hit = lookup(conditionIndices, [norm(row.name_en), norm(row.name)]);
    if (!hit) {
      condUnmatched.push(row.name_en ?? row.name ?? row.id);
      continue;
    }
    condMatched++;
    if (!DRY) {
      const { error } = await supabase
        .from('health_conditions')
        .update({ canonical_id: hit.canonical_id, canonical_source: hit.canonical_source })
        .eq('id', row.id);
      if (error) console.error(`   ✗ ${row.name}:`, error.message);
    }
  }
  console.log(`   ✓ matched: ${condMatched} | unmatched: ${condUnmatched.length}`);

  // -- nutraceuticals ---------------------------------------------------------
  const nutraIndices = [
    { source: 'chebi', map: chebi.byName },
    { source: 'mesh', map: mesh.byName },
  ];

  const { data: nutras, error: nutErr } = await supabase
    .from('nutraceuticals')
    .select('id, name, name_en, canonical_id')
    .is('canonical_id', null);
  if (nutErr) throw nutErr;
  console.log(`\n💊 nutraceuticals sem canonical_id: ${nutras?.length ?? 0}`);

  let nutMatched = 0;
  const nutUnmatched: string[] = [];
  for (const row of nutras ?? []) {
    const hit = lookup(nutraIndices, [norm(row.name_en), norm(row.name)]);
    if (!hit) {
      nutUnmatched.push(row.name_en ?? row.name ?? row.id);
      continue;
    }
    nutMatched++;
    if (!DRY) {
      const { error } = await supabase
        .from('nutraceuticals')
        .update({ canonical_id: hit.canonical_id, canonical_source: hit.canonical_source })
        .eq('id', row.id);
      if (error) console.error(`   ✗ ${row.name}:`, error.message);
    }
  }
  console.log(`   ✓ matched: ${nutMatched} | unmatched: ${nutUnmatched.length}`);

  console.log('\n— Resumo —');
  console.log(`  health_conditions: ${condMatched} matched / ${condUnmatched.length} pendentes`);
  console.log(`  nutraceuticals:    ${nutMatched} matched / ${nutUnmatched.length} pendentes`);

  if (condUnmatched.length) {
    console.log('\n  Pendentes (conditions) — precisarão curadoria manual:');
    condUnmatched.slice(0, 30).forEach(n => console.log(`    · ${n}`));
    if (condUnmatched.length > 30) console.log(`    … +${condUnmatched.length - 30}`);
  }
  if (nutUnmatched.length) {
    console.log('\n  Pendentes (nutraceuticals):');
    nutUnmatched.slice(0, 30).forEach(n => console.log(`    · ${n}`));
    if (nutUnmatched.length > 30) console.log(`    … +${nutUnmatched.length - 30}`);
  }

  if (DRY) console.log('\n⚠ DRY RUN — nada foi gravado. Rode sem --dry-run para aplicar.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
