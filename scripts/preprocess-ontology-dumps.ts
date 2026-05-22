/**
 * Pre-processa os 3 dumps de ontologia (OMIA, MeSH, ChEBI) localmente
 * em 3 JSONs pequenos (apenas mapas name → canonical_id).
 *
 * Não precisa de chave nenhuma — só lê arquivos locais.
 *
 * Uso:
 *   DUMP_DIR=~/senex-papers npx tsx scripts/preprocess-ontology-dumps.ts
 *
 * Saída (em ./dist-ontology/):
 *   - omia-canine.json   (~1-2 MB)
 *   - mesh.json          (~3-5 MB)
 *   - chebi.json         (~2-3 MB)
 *
 * Em seguida, faça upload desses 3 JSONs para o bucket Storage
 * `ontology-indexes` (criado por migração) e chame a edge function
 * `import-canonical-ids` no admin.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseChebiObo } from './parsers/chebi-obo';
import { parseMeshXml } from './parsers/mesh-xml';
import { parseOmiaXml } from './parsers/omia-xml';

function expandHome(p: string): string {
  if (p.startsWith('~')) return path.join(os.homedir(), p.slice(1));
  return p;
}

async function main() {
  const dumpDir = expandHome(process.env.DUMP_DIR || '~/senex-papers');
  const outDir = path.resolve('./dist-ontology');
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`📂 Lendo dumps de: ${dumpDir}`);
  console.log(`💾 Escrevendo JSONs em: ${outDir}\n`);

  // ---- OMIA ----
  const omiaPath = path.join(dumpDir, 'omia.xml.gz');
  if (fs.existsSync(omiaPath)) {
    console.log('🐕 Processando OMIA (gz XML, filtrando Canis 9615)...');
    const t = Date.now();
    const omia = await parseOmiaXml(omiaPath);
    const obj = Object.fromEntries(omia.byName);
    fs.writeFileSync(path.join(outDir, 'omia-canine.json'), JSON.stringify(obj));
    console.log(`   ✅ ${omia.byName.size} fenes caninos em ${((Date.now() - t) / 1000).toFixed(1)}s\n`);
  } else {
    console.warn(`   ⚠️  ${omiaPath} não encontrado — pulando OMIA\n`);
  }

  // ---- MeSH ----
  const meshPath = path.join(dumpDir, 'desc2026.xml');
  if (fs.existsSync(meshPath)) {
    console.log('🏥 Processando MeSH (XML grande, ~298 MB)...');
    const t = Date.now();
    const mesh = await parseMeshXml(meshPath);
    const obj = Object.fromEntries(mesh.byName);
    fs.writeFileSync(path.join(outDir, 'mesh.json'), JSON.stringify(obj));
    console.log(`   ✅ ${mesh.byName.size} descritores em ${((Date.now() - t) / 1000).toFixed(1)}s\n`);
  } else {
    console.warn(`   ⚠️  ${meshPath} não encontrado — pulando MeSH\n`);
  }

  // ---- ChEBI ----
  const chebiPath = path.join(dumpDir, 'chebi.obo');
  if (fs.existsSync(chebiPath)) {
    console.log('🧪 Processando ChEBI (OBO line-by-line)...');
    const t = Date.now();
    const chebi = await parseChebiObo(chebiPath);
    const obj = Object.fromEntries(chebi.byName);
    fs.writeFileSync(path.join(outDir, 'chebi.json'), JSON.stringify(obj));
    console.log(`   ✅ ${chebi.byName.size} compostos em ${((Date.now() - t) / 1000).toFixed(1)}s\n`);
  } else {
    console.warn(`   ⚠️  ${chebiPath} não encontrado — pulando ChEBI\n`);
  }

  console.log('🎉 Concluído!\n');
  console.log('Próximo passo: faça upload dos 3 JSONs em Cloud → Storage → bucket `ontology-indexes`');
  console.log('(eu vou criar o bucket e a edge function no próximo passo)\n');
}

main().catch((e) => {
  console.error('❌ Erro:', e);
  process.exit(1);
});