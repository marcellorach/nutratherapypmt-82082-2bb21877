#!/usr/bin/env node
// Parse CHANGELOG.md → src/data/projectChangelog.generated.ts + .lovable/CONTEXT.md
// + atualiza organogramaLastUpdated em src/data/projectOrganograma.ts.
// Tolerante: blocos antigos viram area="meta". Falha cedo se IO quebrar.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const CHANGELOG = path.join(ROOT, "CHANGELOG.md");
const OUT_TS = path.join(ROOT, "src/data/projectChangelog.generated.ts");
const ORG_TS = path.join(ROOT, "src/data/projectOrganograma.ts");
const CTX_MD = path.join(ROOT, ".lovable/CONTEXT.md");

export const KIND_MAP = {
  added: "added", changed: "changed", fixed: "fixed",
  removed: "removed", security: "security", deprecated: "changed",
};

// Inferência de área por path. Ordem importa: mais específico primeiro.
export const AREA_RULES = [
  [/^supabase\/functions\/kg-/i, "kg"],
  [/^supabase\/functions\/.*triplet/i, "curation"],
  [/^supabase\/functions\/process-pdf|digest|extract/i, "curation"],
  [/^supabase\/functions\//i, "infra"],
  [/^supabase\/migrations\//i, "infra"],
  [/^src\/pages\/administrador\//i, "admin"],
  [/^src\/components\/administrador\/organograma\//i, "admin"],
  [/^src\/components\/administrador\//i, "admin"],
  [/^src\/config\/admin-tabs/i, "admin"],
  [/^src\/pages\/veterinario\//i, "vet-ui"],
  [/^src\/components\/pet\//i, "vet-ui"],
  [/^src\/components\/tutor\//i, "tutor-ui"],
  [/^src\/pages\/tutor\//i, "tutor-ui"],
  [/^src\/services\/clinical\//i, "clinical-pipeline"],
  [/^src\/services\/.*pipeline/i, "clinical-pipeline"],
  [/^src\/data\/biomedical-taxonomy/i, "kg"],
  [/knowledge[-_]?graph|triplet|neo4j/i, "kg"],
  [/base[-_]?knowledge/i, "base-knowledge"],
  [/^src\/contexts\/Auth|src\/pages\/Auth/i, "auth"],
  [/^src\/locales\/|^src\/i18n/i, "i18n"],
  [/^src\/data\/projectOrganograma|projectChangelog/i, "admin"],
];

export function inferArea(files) {
  for (const f of files) {
    for (const [rx, area] of AREA_RULES) if (rx.test(f)) return area;
  }
  return "meta";
}

export function extractFiles(text) {
  const found = new Set();
  // padrões: src/..., supabase/..., scripts/..., .lovable/...
  const rx = /(?:^|[\s`(,])([a-zA-Z0-9_./-]*(?:src|supabase|scripts|\.lovable|public)\/[a-zA-Z0-9_./-]+\.(?:tsx?|jsx?|mjs|cjs|json|sql|md|css))/g;
  let m;
  while ((m = rx.exec(text)) !== null) {
    found.add(m[1].replace(/^[`(,]+/, ""));
  }
  return [...found];
}

export function parseMetaComment(line) {
  // <!-- area: admin · status: entregue · i18n: 1.38.0 · pr: 123 -->
  const m = line.match(/<!--\s*(.+?)\s*-->/);
  if (!m) return {};
  const out = {};
  for (const part of m[1].split(/[·,;|]/)) {
    const kv = part.split(":").map((s) => s.trim());
    if (kv.length === 2 && kv[0]) out[kv[0].toLowerCase()] = kv[1];
  }
  return out;
}

export function parseChangelog(md) {
  const lines = md.split("\n");
  const entries = [];
  let cur = null;
  // ### Added - 2026-04-29 [—|🗺️|título...] resto
  const HEAD = /^###\s+(Added|Changed|Fixed|Removed|Security|Deprecated)\s*[-—]\s*(\d{4}-\d{2}-\d{2})\s*[—-]?\s*(.*)$/i;

  const pushCur = () => {
    if (!cur) return;
    const blockText = cur.bullets.join("\n");
    const filesFromMeta = cur.meta.files
      ? cur.meta.files.split(/\s+/).filter(Boolean)
      : [];
    const filesFromBullets = extractFiles(blockText + "\n" + cur.title);
    const files = [...new Set([...filesFromMeta, ...filesFromBullets])];
    const area = cur.meta.area || inferArea(files);
    const status =
      cur.meta.status ||
      (/\brevertido\b/i.test(blockText) ? "revertido"
        : /\bparcial\b/i.test(blockText) ? "parcial"
        : "entregue");
    const i18nMatch = (cur.title + " " + blockText).match(/i18n[^\d]*v?(\d+\.\d+\.\d+)/i);
    const i18nVersion = cur.meta.i18n || (i18nMatch ? i18nMatch[1] : undefined);
    const commit = cur.meta.commit || undefined;
    entries.push({
      date: cur.date,
      kind: KIND_MAP[cur.kind.toLowerCase()] || "changed",
      area,
      status,
      title: cur.title.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "").trim(),
      bullets: cur.bullets
        .map((b) => b.replace(/^[-*]\s*(?:✅\s*)?/, "").replace(/\*\*/g, "").trim())
        .filter(Boolean),
      files: files.length ? files : undefined,
      i18nVersion,
      commit,
    });
    cur = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const head = ln.match(HEAD);
    if (head) {
      pushCur();
      cur = { kind: head[1], date: head[2], title: head[3].trim(), bullets: [], meta: {} };
      continue;
    }
    if (!cur) continue;
    if (/^##\s/.test(ln)) { pushCur(); continue; }
    const meta = parseMetaComment(ln);
    // só aceita meta-comment se a linha for *apenas* o comentário (não dentro de bullet)
    if (Object.keys(meta).length && /^\s*<!--/.test(ln)) {
      Object.assign(cur.meta, meta);
      continue;
    }
    if (/^[-*]\s+/.test(ln)) cur.bullets.push(ln);
    else if (/^\s+[-*]\s+/.test(ln)) cur.bullets.push(ln);
  }
  pushCur();
  // mais recentes primeiro
  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return entries;
}

function emitTs(entries) {
  const header = `// AUTO-GERADO por scripts/sync-changelog.mjs a partir de CHANGELOG.md.
// NÃO EDITE À MÃO. Rode \`npm run sync:changelog\` após editar o CHANGELOG.
// Última geração: ${new Date().toISOString()}

import type { OrganogramaAreaKey } from "@/data/projectOrganograma";

export type ChangelogStatus = "entregue" | "parcial" | "revertido";
export type ChangelogKind = "added" | "changed" | "fixed" | "removed" | "security";

export interface ChangelogEntry {
  date: string;
  area: OrganogramaAreaKey | "meta";
  kind: ChangelogKind;
  title: string;
  bullets: string[];
  files?: string[];
  status: ChangelogStatus;
  i18nVersion?: string;
  commit?: string;
}

export const lastChangelogDate = ${JSON.stringify(entries[0]?.date ?? "")};

export const changelog: ChangelogEntry[] = ${JSON.stringify(entries, null, 2)};
`;
  return header;
}

function emitContext(entries) {
  const top = entries.slice(0, 10);
  const since = new Date(Date.now() - 14 * 86400e3).toISOString().slice(0, 10);
  const recent = entries.filter((e) => e.date >= since);
  const byArea = {};
  for (const e of recent) byArea[e.area] = (byArea[e.area] || 0) + 1;
  const lastI18n = entries.find((e) => e.i18nVersion)?.i18nVersion ?? "—";

  const lines = [];
  lines.push("# Project context briefing (auto)");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("Read this file BEFORE starting any non-trivial task. It is the project's working memory.");
  lines.push("");
  lines.push(`## Latest i18n version: ${lastI18n}`);
  lines.push("");
  lines.push(`## Changes by area (last 14 days)`);
  for (const [a, n] of Object.entries(byArea).sort((x, y) => y[1] - x[1])) {
    lines.push(`- **${a}**: ${n}`);
  }
  lines.push("");
  lines.push(`## Top ${top.length} recent entries`);
  for (const e of top) {
    lines.push(`### ${e.date} · [${e.area}] ${e.kind.toUpperCase()} — ${e.title}`);
    if (e.status !== "entregue") lines.push(`_status: ${e.status}_`);
    for (const b of e.bullets.slice(0, 3)) lines.push(`- ${b}`);
    if (e.files?.length) lines.push(`_files: ${e.files.slice(0, 4).join(", ")}${e.files.length > 4 ? "…" : ""}_`);
    lines.push("");
  }
  lines.push("---");
  lines.push("To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.");
  return lines.join("\n");
}

function updateOrganogramaDate(date) {
  if (!date) return;
  const txt = fs.readFileSync(ORG_TS, "utf8");
  const next = txt.replace(
    /export const organogramaLastUpdated = "[^"]*";/,
    `export const organogramaLastUpdated = "${date}";`,
  );
  if (next !== txt) fs.writeFileSync(ORG_TS, next);
}

function main() {
  const md = fs.readFileSync(CHANGELOG, "utf8");
  const entries = parseChangelog(md);
  if (!entries.length) {
    console.error("[sync-changelog] No entries parsed — aborting (keeping previous generated file).");
    process.exit(1);
  }
  fs.writeFileSync(OUT_TS, emitTs(entries));
  fs.mkdirSync(path.dirname(CTX_MD), { recursive: true });
  fs.writeFileSync(CTX_MD, emitContext(entries));
  updateOrganogramaDate(entries[0].date);
  console.log(`[sync-changelog] OK — ${entries.length} entries · last: ${entries[0].date} · area: ${entries[0].area}`);
}

const isCli = (() => {
  try {
    return fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1] || "");
  } catch {
    return false;
  }
})();

if (isCli) main();