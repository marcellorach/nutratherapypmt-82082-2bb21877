#!/usr/bin/env bash
set -euo pipefail

DUMP_DIR="${DUMP_DIR:-$HOME/senex-papers}"
OUT_DIR="${OUT_DIR:-$DUMP_DIR/dist-ontology}"
WORK_DIR="$(mktemp -d -t ontology-preprocess-XXXXXX)"

echo "==> DUMP_DIR=$DUMP_DIR"
echo "==> OUT_DIR=$OUT_DIR"
echo "==> WORK_DIR=$WORK_DIR"

for f in omia.xml.gz desc2026.xml chebi.obo; do
  if [ ! -f "$DUMP_DIR/$f" ]; then
    echo "ERRO: arquivo não encontrado: $DUMP_DIR/$f"
    echo "Verifique: ls -lh $DUMP_DIR"
    exit 1
  fi
done

mkdir -p "$OUT_DIR"
cd "$WORK_DIR"

cat > package.json << 'JSON'
{ "name": "ontology-preprocess", "type": "module", "dependencies": { "sax": "^1.3.0" } }
JSON

echo "==> Instalando sax (~5s)..."
bun install --silent

cat > index.mjs << 'MJS'
import * as fs from 'node:fs';
import * as zlib from 'node:zlib';
import * as readline from 'node:readline';
import sax from 'sax';

const DUMP_DIR = process.env.DUMP_DIR;
const OUT_DIR = process.env.OUT_DIR;

function logStart(name){ console.log(`\n[${name}] iniciando...`); return Date.now(); }
function logEnd(name, t0, total){
  const s = ((Date.now()-t0)/1000).toFixed(1);
  console.log(`[${name}] ✓ ${total} entradas em ${s}s`);
}

// ===== OMIA (gz MySQL XML, filter gb_species_id=9615) =====
async function parseOmia(path){
  const t0 = logStart('OMIA');
  return new Promise((resolve,reject)=>{
    const parser = sax.createStream(true,{trim:true});
    const byName = new Map(); let total=0;
    let currentTable=null, inRow=false, row={}, pendingField=null;
    parser.on('opentag', n=>{
      const a=n.attributes;
      if(n.name==='table_data') currentTable=a.name??null;
      else if(n.name==='row' && currentTable){ inRow=true; row={}; }
      else if(n.name==='field' && inRow) pendingField=a.name??null;
    });
    parser.on('text', t=>{ if(pendingField!==null) row[pendingField]=(row[pendingField]??'')+t; });
    parser.on('closetag', name=>{
      if(name==='field') pendingField=null;
      else if(name==='row' && inRow){
        if(currentTable==='Phene' && row.gb_species_id==='9615'){
          const phene=(row.phene_name??'').trim(), id=(row.phene_id??'').trim();
          if(phene && id){ const k=phene.toLowerCase(); if(!byName.has(k)) byName.set(k,`${id}-9615`); total++; }
        }
        inRow=false; row={};
      } else if(name==='table_data') currentTable=null;
    });
    parser.on('error', reject);
    parser.on('end', ()=>{ logEnd('OMIA',t0,total); resolve({byName,total}); });
    fs.createReadStream(path).pipe(zlib.createGunzip()).pipe(parser);
  });
}

// ===== MeSH (desc XML, filter tree C/D) =====
async function parseMesh(path){
  const t0 = logStart('MeSH');
  return new Promise((resolve,reject)=>{
    const parser = sax.createStream(true,{trim:true});
    const byName = new Map(); let total=0;
    let inRecord=false, descUI=null, descName=null, trees=[], terms=[];
    const stack=[]; let pUI=false,pName=false,pTree=false,pTerm=false;
    const flush=()=>{
      if(!descUI||!descName) return;
      if(!trees.some(t=>['C','D'].includes(t.charAt(0)))) return;
      const add=n=>{ const k=n.trim().toLowerCase(); if(k && !byName.has(k)) byName.set(k,descUI); };
      add(descName); for(const t of terms) add(t); total++;
    };
    parser.on('opentag', n=>{
      stack.push(n.name);
      if(n.name==='DescriptorRecord'){ inRecord=true; descUI=null; descName=null; trees=[]; terms=[]; }
      if(!inRecord) return;
      if(n.name==='DescriptorUI' && stack[stack.length-2]==='DescriptorRecord') pUI=true;
      if(n.name==='String' && stack[stack.length-2]==='DescriptorName') pName=true;
      if(n.name==='TreeNumber') pTree=true;
      if(n.name==='String' && stack[stack.length-2]==='Term') pTerm=true;
    });
    parser.on('text', t=>{
      if(pUI){descUI=t;pUI=false;}
      else if(pName){descName=t;pName=false;}
      else if(pTree){trees.push(t);pTree=false;}
      else if(pTerm){terms.push(t);pTerm=false;}
    });
    parser.on('closetag', name=>{ stack.pop(); if(name==='DescriptorRecord'){ flush(); inRecord=false; } });
    parser.on('error', reject);
    parser.on('end', ()=>{ logEnd('MeSH',t0,total); resolve({byName,total}); });
    fs.createReadStream(path).pipe(parser);
  });
}

// ===== ChEBI (OBO, line-based) =====
async function parseChebi(path){
  const t0 = logStart('ChEBI');
  const rl = readline.createInterface({input:fs.createReadStream(path), crlfDelay:Infinity});
  const byName = new Map();
  let inTerm=false,id=null,name=null,syns=[],obs=false,total=0;
  const flush=()=>{
    if(id && name && !obs){
      const cid=id.replace(/^CHEBI:/i,'');
      const add=n=>{ const k=n.trim().toLowerCase(); if(k && !byName.has(k)) byName.set(k,cid); };
      add(name); for(const s of syns) add(s); total++;
    }
    inTerm=false; id=null; name=null; syns=[]; obs=false;
  };
  for await (const line of rl){
    if(line.startsWith('[Term]')){ flush(); inTerm=true; continue; }
    if(line.startsWith('[') && !line.startsWith('[Term]')){ flush(); continue; }
    if(!inTerm) continue;
    if(line.startsWith('id: ')) id=line.slice(4).trim();
    else if(line.startsWith('name: ')) name=line.slice(6).trim();
    else if(line.startsWith('is_obsolete: true')) obs=true;
    else if(line.startsWith('synonym: ')){ const m=line.match(/^synonym: "([^"]+)"/); if(m) syns.push(m[1]); }
  }
  flush();
  logEnd('ChEBI',t0,total);
  return {byName,total};
}

function writeJson(file, idx){
  const obj = Object.fromEntries(idx.byName);
  fs.writeFileSync(file, JSON.stringify(obj));
  const kb = (fs.statSync(file).size/1024).toFixed(0);
  console.log(`  → ${file} (${kb} KB, ${idx.byName.size} chaves únicas)`);
}

const omia  = await parseOmia(`${DUMP_DIR}/omia.xml.gz`);
const mesh  = await parseMesh(`${DUMP_DIR}/desc2026.xml`);
const chebi = await parseChebi(`${DUMP_DIR}/chebi.obo`);

console.log('\n==> Salvando JSONs...');
writeJson(`${OUT_DIR}/omia-canine.json`, omia);
writeJson(`${OUT_DIR}/mesh.json`,        mesh);
writeJson(`${OUT_DIR}/chebi.json`,       chebi);

console.log('\n✅ PRONTO! Totais brutos:');
console.log(`   OMIA  (canine phenes): ${omia.total}`);
console.log(`   MeSH  (C+D records):   ${mesh.total}`);
console.log(`   ChEBI (terms):         ${chebi.total}`);
MJS

echo "==> Processando dumps (pode demorar 2-5 min)..."
DUMP_DIR="$DUMP_DIR" OUT_DIR="$OUT_DIR" bun run index.mjs

echo ""
echo "==> Arquivos gerados:"
ls -lh "$OUT_DIR"
