#!/usr/bin/env node
// Copia snapshots auditáveis (drift, arch, changelog, prompts) para public/snapshots/
// e gera um manifest.json com sha-256, bytes e generated_at de cada arquivo.
// É o último passo do `audit:prebuild`. Sem isso, o painel "Preview vs Publicado"
// não consegue baixar os arquivos pelo navegador.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public/snapshots");

// Origem → nome publicado em /snapshots/<nome>
const SOURCES = [
  { src: "public/drift-report.json",        dest: "drift-report.json" },
  { src: "docs/generated/ARCHITECTURE_LIVE.md", dest: "ARCHITECTURE_LIVE.md" },
  { src: "CHANGELOG.md",                     dest: "CHANGELOG.md" },
  { src: "docs/generated/PROMPTS.md",        dest: "PROMPTS.md" },
];

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const manifest = {
  generated_at: new Date().toISOString(),
  files: [],
};

for (const { src, dest } of SOURCES) {
  const srcPath = path.join(ROOT, src);
  const destPath = path.join(OUT_DIR, dest);
  if (!fs.existsSync(srcPath)) {
    console.warn(`[copy-snapshots] ausente: ${src} (pulando)`);
    manifest.files.push({ file: dest, status: "missing" });
    continue;
  }
  const buf = fs.readFileSync(srcPath);
  fs.writeFileSync(destPath, buf);
  manifest.files.push({
    file: dest,
    bytes: buf.length,
    sha256: sha256(buf),
    status: "ok",
  });
  console.log(`[copy-snapshots] ${src} → public/snapshots/${dest} (${buf.length} B)`);
}

fs.writeFileSync(
  path.join(OUT_DIR, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(`[copy-snapshots] manifest.json escrito (${manifest.files.length} arquivos)`);