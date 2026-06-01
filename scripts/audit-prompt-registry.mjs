#!/usr/bin/env node
/**
 * Compliance lint: garante que toda edge function que chama LLM use o registro
 * único de prompts (`fetchSystemPrompt`/`getSystemPrompt`) em vez de strings
 * hardcoded.
 *
 * Regra: se um arquivo contém `role: 'system'` (ou `"system"`) e NÃO importa
 * `fetchSystemPrompt`/`getSystemPrompt` do _shared/system-prompts.ts, ele é
 * marcado como pendente de migração.
 *
 * Uso:
 *   node scripts/audit-prompt-registry.mjs           # relatório legível
 *   node scripts/audit-prompt-registry.mjs --json    # saída JSON
 *   node scripts/audit-prompt-registry.mjs --strict  # exit 1 se houver pendências
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const FUNCTIONS_DIR = join(ROOT, "supabase", "functions");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".ts")) out.push(full);
  }
  return out;
}

const SYSTEM_REGEX = /role:\s*['"]system['"]/;
const REGISTRY_REGEX = /fetchSystemPrompt|getSystemPrompt/;

const files = walk(FUNCTIONS_DIR);
const compliant = [];
const pending = [];
const noLlm = [];

for (const f of files) {
  const src = readFileSync(f, "utf8");
  const rel = relative(ROOT, f);
  if (rel.includes("/_shared/")) continue; // shared helpers
  if (!SYSTEM_REGEX.test(src)) {
    noLlm.push(rel);
    continue;
  }
  if (REGISTRY_REGEX.test(src)) compliant.push(rel);
  else pending.push(rel);
}

const isJson = process.argv.includes("--json");
const isStrict = process.argv.includes("--strict");

if (isJson) {
  console.log(JSON.stringify({ compliant, pending, total_with_llm: compliant.length + pending.length }, null, 2));
} else {
  console.log(`\nPrompt Registry Compliance — ${compliant.length + pending.length} edge functions com LLM`);
  console.log(`  ✅ Compliant (usam registro): ${compliant.length}`);
  console.log(`  ⚠️  Pendentes (prompt hardcoded): ${pending.length}\n`);
  if (pending.length) {
    console.log("Pendentes:");
    pending.forEach((p) => console.log(`  - ${p}`));
  }
  if (compliant.length) {
    console.log("\nCompliant:");
    compliant.forEach((p) => console.log(`  - ${p}`));
  }
}

if (isStrict && pending.length > 0) process.exit(1);