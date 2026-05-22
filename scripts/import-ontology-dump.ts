/**
 * import-ontology-dump.ts
 * Lê dumps offline (OMIA / MeSH) e popula `public.veterinary_ontology`
 * com `canonical_id` + `canonical_source`. Faz best-effort matching contra
 * `health_conditions` / `nutraceuticals` por nome exato; o restante fica
 * pendente para curadoria manual.
 *
 * Uso:
 *   npx tsx scripts/import-ontology-dump.ts --source=omia  --file=data/ontologies/omia.txt
 *   npx tsx scripts/import-ontology-dump.ts --source=mesh  --file=data/ontologies/desc2026.xml
 *
 * Pré-requisitos:
 *   - Dumps baixados manualmente em data/ontologies/ (gitignored).
 *   - SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.
 *
 * Ver docs/ONTOLOGY_SOURCES.md para origem oficial dos dumps.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as readline from 'readline';

type Source = 'omia' | 'mesh';

interface OntologyRow {
  external_id: string;
  source: Source;
  name: string;
  name_en?: string;
  synonyms?: string[];
  description?: string;
  species_taxonomy_id?: string;
}

const CANIS_TAX_ID = '9615';

function parseArgs(): { source: Source; file: string } {
  const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v];
    }),
  );
  if (!args.source || !args.file) {
    console.error('Uso: --source=omia|mesh --file=<path>');
    process.exit(1);
  }
  return { source: args.source as Source, file: args.file };
}

/**
 * Parser mínimo do `omia.txt` (formato @-record).
 * Cada registro começa com `@@@@@` e tem campos `field|value`.
 * Filtramos species = 9615 (Canis lupus familiaris).
 */
async function* parseOmia(path: string): AsyncGenerator<OntologyRow> {
  const rl = readline.createInterface({
    input: fs.createReadStream(path),
    crlfDelay: Infinity,
  });
  let record: Record<string, string> = {};
  for await (const line of rl) {
    if (line.startsWith('@@@@@')) {
      if (record.species_specific_name === CANIS_TAX_ID && record.phene_name) {
        yield {
          external_id: `${record.omia_id}-${CANIS_TAX_ID}`,
          source: 'omia',
          name: record.phene_name,
          name_en: record.phene_name,
          description: record.summary,
          species_taxonomy_id: CANIS_TAX_ID,
        };
      }
      record = {};
      continue;
    }
    const idx = line.indexOf('|');
    if (idx > 0) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      record[k] = v;
    }
  }
}

/**
 * Parser SAX-ish do MeSH desc XML. Para um import de produção é melhor
 * usar `sax` ou `xml-flow`; este stub deixa o gancho pronto.
 */
async function* parseMesh(path: string): AsyncGenerator<OntologyRow> {
  // TODO: integrar `sax` para streaming. Por ora, falha rápido com instrução.
  throw new Error(
    `MeSH parser ainda não implementado. Baixe ${path} e adicione lib 'sax' em devDependencies para habilitar.`,
  );
  yield {} as OntologyRow; // unreachable
}

async function main() {
  const { source, file } = parseArgs();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  const generator = source === 'omia' ? parseOmia(file) : parseMesh(file);
  let batch: OntologyRow[] = [];
  let total = 0;

  const flush = async () => {
    if (!batch.length) return;
    const rows = batch.map(r => ({
      entity_id: `${r.source}:${r.external_id}`,
      entity_name: r.name,
      entity_name_en: r.name_en ?? r.name,
      source: r.source,
      synonyms: r.synonyms ?? [],
      description: r.description ?? null,
    }));
    const { error } = await supabase
      .from('veterinary_ontology')
      .upsert(rows, { onConflict: 'entity_id' });
    if (error) throw error;
    total += rows.length;
    console.log(`  upsert +${rows.length} (total ${total})`);
    batch = [];
  };

  for await (const row of generator) {
    batch.push(row);
    if (batch.length >= 200) await flush();
  }
  await flush();

  console.log(`✓ ${source} import concluído. ${total} registros gravados.`);
  console.log(
    'Próximo passo: rodar matching manual na aba Ontologia (admin) para vincular canonical_id às tabelas health_conditions / nutraceuticals.',
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});