#!/usr/bin/env node
/**
 * drift-guard.mjs — WARN-only consistency checker.
 *
 * Compara as superfícies escritas à mão (AboutSenexTab, CORE_RULES,
 * GRAPHRAG_ARCHITECTURE, admin-tabs-info-bilingual, landing) com a verdade-base
 * em scripts/generate-architecture-live.mjs (MATRIX) e com o código real.
 *
 * Camadas:
 *  A. Vocabulário proibido — termos `GRRA`, `U-Retrieval`, `TransE`, `RWD`,
 *     "Real-World Data", "dados reais", "base de pacientes reais",
 *     "ingestão massiva" só podem aparecer se acompanhados de marcador
 *     `(inspiração|inspiration|planned|não implementado|not implemented|sintético|synthetic)`
 *     no mesmo parágrafo. Áreas geradas (`docs/generated/**`, `CHANGELOG.md`)
 *     e o próprio prompt do auditor são isentos.
 *  B. Ponteiros vivos — para cada linha da MATRIX, cada caminho citado em
 *     `pointer` precisa existir no repo (strip de `:linha`).
 *  C. Status × código (WARN) — para linhas `implemented`, sinaliza se o
 *     ponteiro aponta para um arquivo trivial (<20 LOC) — sintoma de "implemented"
 *     mas vazio.
 *  D. Conflito numérico — extrai e expõe lado-a-lado:
 *       - RC-013 (CORE_RULES.md) vs auto-approve em generate-triplets/index.ts;
 *       - RC-003 modulador (CORE_RULES.md) vs uso em src/**.
 *     Não escolhe número; só denuncia divergência.
 *
 * Saídas:
 *  - docs/generated/DRIFT_REPORT.md (humano)
 *  - public/drift-report.json       (consumido pelo edge generate-audit)
 *
 * WARN-only: nunca falha o processo. Exit 0 sempre.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from "node:fs";
import { dirname, resolve, relative, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_MD = resolve(ROOT, "docs/generated/DRIFT_REPORT.md");
const OUT_JSON = resolve(ROOT, "public/drift-report.json");
const today = new Date().toISOString().slice(0, 10);

const findings = []; // {layer, severity, surface, message, evidence?}
const push = (f) => findings.push(f);

function safeRead(p) {
  try { return readFileSync(p, "utf8"); } catch { return null; }
}
function walk(dir, exts) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
}

// ============================================================
// Layer A — forbidden vocab in hand-written surfaces
// ============================================================
const FORBIDDEN = [
  { rx: /\bGRRA\b/g, term: "GRRA" },
  { rx: /U[- ]Retrieval/gi, term: "U-Retrieval" },
  { rx: /\bTransE\b/g, term: "TransE" },
  { rx: /\bRWD\b/g, term: "RWD" },
  { rx: /Real[- ]World Data/gi, term: "Real-World Data" },
  { rx: /base de pacientes reais/gi, term: "base de pacientes reais" },
  { rx: /ingest[ãa]o massiva/gi, term: "ingestão massiva" },
  { rx: /\bdados (clínicos )?reais\b/gi, term: "dados reais" },
];
const MITIGATOR =
  /(inspira[çc][ãa]o|inspiration|planned|planejado|n[ãa]o implementado|not implemented|sint[ée]tico|synthetic|cohort sint|synthetic_cohort)/i;

const HAND_SURFACES = [
  "src/components/administrador/AboutSenexTab.tsx",
  "src/data/admin-tabs-info.ts",
  "src/data/admin-tabs-info-bilingual.ts",
  "docs/CORE_RULES.md",
  "docs/GRAPHRAG_ARCHITECTURE.md",
  "docs/NTAI_KNOWLEDGE_GRAPH_ARCHITECTURE.md",
  "docs/STATE_REAL_VS_MOCK.md",
  "docs/STANFORD_DEMO.md",
  ...walk(resolve(ROOT, "src/components/landing"), [".tsx", ".ts"]).map((p) => relative(ROOT, p)),
];

for (const rel of HAND_SURFACES) {
  const abs = resolve(ROOT, rel);
  const txt = safeRead(abs);
  if (!txt) continue;
  const lines = txt.split("\n");
  for (const { rx, term } of FORBIDDEN) {
    rx.lastIndex = 0;
    let m;
    while ((m = rx.exec(txt))) {
      // Window ±240 chars to check mitigator presence (paragraph-ish).
      const start = Math.max(0, m.index - 240);
      const end = Math.min(txt.length, m.index + m[0].length + 240);
      const window = txt.slice(start, end);
      if (MITIGATOR.test(window)) continue;
      // Line number
      let upto = 0, lineNo = 1;
      for (let i = 0; i < lines.length; i++) {
        upto += lines[i].length + 1;
        if (upto > m.index) { lineNo = i + 1; break; }
      }
      push({
        layer: "A",
        severity: "warn",
        surface: rel,
        message: `Termo "${term}" sem mitigador (inspiração/planned/sintético) no parágrafo.`,
        evidence: `${rel}:${lineNo} — ${lines[lineNo - 1]?.trim().slice(0, 200) ?? ""}`,
      });
    }
  }
}

// ============================================================
// Layer B + C — live pointers from MATRIX
// ============================================================
const MATRIX = [];
{
  const src = safeRead(resolve(ROOT, "scripts/generate-architecture-live.mjs")) ?? "";
  const rx = /capability:\s*['"`]([^'"`]+)['"`][\s\S]*?status:\s*['"`](\w+)['"`][\s\S]*?pointer:\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = rx.exec(src))) MATRIX.push({ capability: m[1], status: m[2], pointer: m[3] });
}

for (const row of MATRIX) {
  if (row.pointer.startsWith("—")) continue; // explicitly not implemented
  // Strip parenthetical prose so "(scoring around heuristic ...)" doesn't become tokens.
  const cleaned = row.pointer.replace(/\(.*?\)/g, " ");
  const tokens = cleaned.split(/[,\s;]+/).map((s) => s.trim()).filter(Boolean);
  for (const tok of tokens) {
    const path = tok.replace(/:\d+.*$/, "").replace(/[.,;]+$/, "");
    if (!path || path.length < 3) continue;
    // Only treat as filesystem path if it has a directory separator or a known extension.
    const looksLikePath = path.includes("/") || /\.(ts|tsx|js|mjs|md|json|sql|css|html)$/i.test(path);
    if (!looksLikePath) continue;
    if (path.startsWith("docs/") || path.startsWith("mem://")) continue;
    const abs = resolve(ROOT, path.replace(/\/$/, ""));
    if (!existsSync(abs)) {
      push({
        layer: "B",
        severity: "warn",
        surface: "ARCHITECTURE_LIVE.MATRIX",
        message: `Ponteiro morto para "${row.capability}": caminho não existe → ${path}`,
      });
      continue;
    }
    if (row.status === "implemented") {
      try {
        const st = statSync(abs);
        if (st.isFile()) {
          const loc = (safeRead(abs) ?? "").split("\n").length;
          if (loc < 20) {
            push({
              layer: "C",
              severity: "info",
              surface: "ARCHITECTURE_LIVE.MATRIX",
              message: `Status 🟢 implemented mas ponteiro tem ${loc} LOC (suspeito de stub): "${row.capability}" → ${path}`,
            });
          }
        }
      } catch { /* ignore */ }
    }
  }
}

// ============================================================
// Layer D — three numeric conflicts (RC-013 / auto-approve / RC-003)
// ============================================================
const conflicts = [];

// RC-013: doc claims a threshold; code in generate-triplets enforces a pair.
const coreRules = safeRead(resolve(ROOT, "docs/CORE_RULES.md")) ?? "";
const triplets = safeRead(resolve(ROOT, "supabase/functions/generate-triplets/index.ts")) ?? "";

function extractFirst(rx, src) {
  const m = rx.exec(src);
  return m ? m[0] : null;
}
const rc013Doc = (() => {
  const block = /RC-013[\s\S]{0,600}/i.exec(coreRules)?.[0] ?? "";
  const m = /(?:≥|>=|>=\s*)\s*0?\.\d+/.exec(block) || /0\.\d+/.exec(block);
  return m ? m[0] : null;
})();
const codeExtractionConf = /extractionConfidence\s*[><=]+\s*0?\.\d+/.exec(triplets)?.[0] ?? null;
const codeKgMatch = /kgMatchScore\s*[><=]+\s*0?\.\d+/.exec(triplets)?.[0] ?? null;

if (rc013Doc || codeExtractionConf || codeKgMatch) {
  conflicts.push({
    name: "auto-approve (RC-013)",
    doc: rc013Doc ?? "n/d em CORE_RULES.md",
    code: [codeExtractionConf, codeKgMatch].filter(Boolean).join(" AND ") || "n/d em generate-triplets/index.ts",
  });
}

// RC-003 modulator (human→dog ×0.7).
const rc003Doc = (() => {
  const block = /RC-003[\s\S]{0,800}/i.exec(coreRules)?.[0] ?? "";
  const m = /[×x]\s*0?\.\d+/.exec(block);
  return m ? m[0] : null;
})();
const rc003UsedAnywhere = (() => {
  const files = walk(resolve(ROOT, "src"), [".ts", ".tsx"]);
  for (const f of files) {
    const t = safeRead(f) ?? "";
    if (/core_rule_modulators/.test(t) || /RC-003/.test(t)) return relative(ROOT, f);
  }
  return null;
})();
conflicts.push({
  name: "RC-003 translational modulator (×0.7)",
  doc: rc003Doc ?? "n/d em CORE_RULES.md",
  code: rc003UsedAnywhere ? `referenciado em ${rc003UsedAnywhere}` : "NÃO referenciado em src/ — provavelmente planejado",
});

if (conflicts.length) {
  for (const c of conflicts) {
    push({
      layer: "D",
      severity: c.code.startsWith("NÃO") || c.code.startsWith("n/d") ? "warn" : "info",
      surface: "CORE_RULES.md × código",
      message: `Conflito numérico em ${c.name} — doc: ${c.doc} · código: ${c.code}`,
    });
  }
}

// ============================================================
// Render
// ============================================================
const summary = findings.reduce((acc, f) => { acc[f.layer] = (acc[f.layer] ?? 0) + 1; return acc; }, {});
const json = {
  generated_at: today,
  total: findings.length,
  by_layer: summary,
  findings,
  numeric_conflicts: conflicts,
  policy: "warn-only — drift-guard nunca bloqueia; humano reconcilia a superfície sinalizada.",
};

mkdirSync(dirname(OUT_MD), { recursive: true });
mkdirSync(dirname(OUT_JSON), { recursive: true });
writeFileSync(OUT_JSON, JSON.stringify(json, null, 2), "utf8");

const md = `# DRIFT_GUARD REPORT

> **Gerado** em ${today} por \`scripts/drift-guard.mjs\` (\`npm run drift:guard\`).
> **WARN-only.** Não bloqueia build/auditoria. Humano reconcilia a superfície sinalizada.

## Resumo

- **Total de achados:** ${findings.length}
- Por camada: ${JSON.stringify(summary)}

## Camadas

- **A** — vocabulário proibido sem mitigador em superfícies à mão
- **B** — ponteiros mortos na MATRIX (arquivo não existe)
- **C** — \`implemented\` com ponteiro stub (<20 LOC) — info
- **D** — conflito numérico doc × código (RC-013, RC-003)

## Achados

${findings.length === 0
  ? "_Nenhum achado. Superfícies à mão consistentes com a MATRIX._\n"
  : findings.map((f) => `### [${f.layer}] ${f.surface}\n- **Severidade:** ${f.severity}\n- ${f.message}${f.evidence ? `\n- Evidência: \`${f.evidence}\`` : ""}`).join("\n\n")}

## Conflitos numéricos rastreados

${conflicts.map((c) => `- **${c.name}** — doc: \`${c.doc}\` · código: \`${c.code}\``).join("\n") || "_nenhum_"}

---
Regerar: \`npm run drift:guard\`.
`;
writeFileSync(OUT_MD, md, "utf8");

console.log(`[drift-guard] ${findings.length} findings → ${relative(ROOT, OUT_MD)} + ${relative(ROOT, OUT_JSON)}`);
process.exit(0);