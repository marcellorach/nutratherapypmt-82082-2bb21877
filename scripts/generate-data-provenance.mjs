#!/usr/bin/env node
// Generates docs/generated/DATA_PROVENANCE.md from live DB counts.
// Runs as a script (read-only). Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// in the environment (same vars used by edge functions). If unavailable, writes
// a stub with "DB unreachable" rather than fake numbers.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const OUT = resolve("docs/generated/DATA_PROVENANCE.md");
mkdirSync(dirname(OUT), { recursive: true });

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const today = new Date().toISOString().slice(0, 10);

async function build() {
  if (!url || !key) {
    return `# DATA_PROVENANCE — DB indisponível\n\n> Gerado em ${today}. SUPABASE_SERVICE_ROLE_KEY ausente; rode \`npm run docs:provenance\` em ambiente com a chave para preencher os números.\n`;
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const count = async (t) => {
    const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
    if (error) return null;
    return count ?? 0;
  };
  const [studies, edges, mkg, ne] = await Promise.all([
    count("studies"), count("hierarchical_edges"), count("medical_knowledge_graph"), count("nutraceuticals"),
  ]);
  const { data: trip } = await sb.from("triplet_extractions").select("curation_status");
  const tripGroups = (trip ?? []).reduce((m, r) => { m[r.curation_status] = (m[r.curation_status] ?? 0) + 1; return m; }, {});

  const { data: pets } = await sb.from("pet_profiles").select("id,is_demo,is_synthetic");
  const synth = new Set(), demo = new Set(), real = new Set();
  for (const p of pets ?? []) {
    if (p.is_synthetic) synth.add(p.id);
    else if (p.is_demo) demo.add(p.id);
    else real.add(p.id);
  }
  const split = async (t) => {
    const { data } = await sb.from(t).select("pet_id");
    const o = { real: 0, demo: 0, synthetic_cohort: 0, unknown: 0, total: (data ?? []).length };
    for (const r of data ?? []) {
      if (synth.has(r.pet_id)) o.synthetic_cohort++;
      else if (demo.has(r.pet_id)) o.demo++;
      else if (real.has(r.pet_id)) o.real++;
      else o.unknown++;
    }
    return o;
  };
  const exams = await split("pet_exams");
  const consults = await split("pet_consultations");
  const meds = await split("pet_medications");
  const conds = await split("pet_conditions");

  const row = (label, o) => `| ${label} | ${o.total} | ${o.real} | ${o.demo} | ${o.synthetic_cohort}${o.unknown ? ` (+${o.unknown} unknown)` : ""} |`;

  return `# DATA_PROVENANCE — proveniência dos números clínicos

> **Gerado automaticamente** em ${today} por \`scripts/generate-data-provenance.mjs\`. NÃO editar à mão.
> Origem: \`count(*)\` direto no Supabase + breakdown por \`pet_profiles.is_demo\` / \`is_synthetic\`.

## Knowledge Graph

| Tabela | Linhas | Status |
|---|---:|---|
| \`hierarchical_edges\` | ${edges ?? "n/d"} | fonte real do grafo (Supabase) |
| \`medical_knowledge_graph\` | ${mkg ?? "n/d"} | **legado vazio** — não usar como métrica |
| \`studies\` | ${studies ?? "n/d"} | PDFs ingeridos |
| \`nutraceuticals\` | ${ne ?? "n/d"} | catálogo base |

### Triplet bank (\`triplet_extractions\`)

| Curation status | Linhas |
|---|---:|
| approved | ${tripGroups.approved ?? 0} |
| pending | ${tripGroups.pending ?? 0} |
| rejected | ${tripGroups.rejected ?? 0} |

## Dados clínicos — split por proveniência

> **Regra:** \`synthetic_cohort\` = gerado pelo prompt \`generate_synthetic_cohort\` (Gemini). **NÃO é Real-World Data**. Calibrado em medicina real, mas não observado em pacientes vivos.

| Tabela | Total | Real (vet inseriu) | Demo (seed \`is_demo\`) | Sintético (cohort) |
|---|---:|---:|---:|---:|
${row("pet_profiles", { total: (pets ?? []).length, real: real.size, demo: demo.size, synthetic_cohort: synth.size, unknown: 0 })}
${row("pet_exams", exams)}
${row("pet_consultations", consults)}
${row("pet_medications", meds)}
${row("pet_conditions", conds)}

## Como atualizar

\`\`\`bash
npm run docs:provenance   # regenera este arquivo
npm run docs:all          # regenera arquitetura + prompts + proveniência
\`\`\`

Qualquer narrativa que cite estes números (ex.: relatório \`generate-audit\`, página "Sobre", investor deck) DEVE separar real vs demo vs sintético. Ver \`audit_base_system_{pt,en}\` em \`supabase/functions/_shared/system-prompts.ts\` para a regra aplicada ao auditor.
`;
}

const md = await build();
writeFileSync(OUT, md);
console.log(`✓ ${OUT}`);
