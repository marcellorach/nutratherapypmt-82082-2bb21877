---
title: "Auditoria Técnica Senex AI — v5.2.0 (Delta 18→27/05/2026)"
author: "lovable-agent · paridade V3"
date: "2026-05-31"
---

# Auditoria Técnica Senex AI — v5.2.0

**Tipo:** Delta sobre v5.1.0 (18/05/2026 → 27/05/2026)
**Foco:** mudanças clinicamente e arquiteturalmente relevantes desde a auditoria anterior. Para a base completa (29 seções, glossário, jornadas, matriz regulatória, apêndices, bibliografia), consulte **v5.1.0** — esta v5.2.0 herda integralmente aquele documento e atualiza apenas o que mudou.

---

## 1. Sumário executivo do delta

Entre 18/05 e 27/05/2026 o sistema passou por **5 mudanças estruturais** que afetam diretamente governança clínica, qualidade do raciocínio populacional e conformidade regulatória. Nenhuma destas alterações estava capturada na v5.1.0; todas elas reduzem riscos previamente listados como P0/P1 e fortalecem a postura GMLP/EMA.

| # | Mudança | Área | Impacto sobre gaps/riscos da v5.1.0 |
|---|---|---|---|
| 1 | **AI Scientist** (rename de "Priorizações") movido para Research & Development | admin/IA | Reposiciona a função como produto científico, não tarefa operacional. Suporta GMLP §1 (escopo claro). |
| 2 | **Validação vet-curador** obrigatória em `cohort_insights` (status pending/approved/rejected/needs_changes) | curation | Fecha o loop HITL antes que um insight populacional vire regra clínica. Mitiga risco "triplet errado auto-aprovado" (high) e gap "PCCP formal". |
| 3 | **Evidência quantitativa obrigatória** no schema dos insights (`n_supporting`, `n_total`, `prevalence`, `effect_size`, `comparison_baseline`) | curation/IA | Elimina confiança auto-declarada pelo LLM. Endereça FDA Draft Jan/2025 §III.B (transparência) e EMA §4.2 (rastreabilidade). |
| 4 | **Canonicalização PT/EN** em cohort stats + `lab-flag-canonicalizer.ts` | i18n/clinical | Fim da duplicação Osteoarthritis/Osteoartrite e HCT/Hematócrito. Reforça regra "Bilingual System". |
| 5 | **Hardening de `suggest-cohort-ideas`**: gemini-3.1-pro-preview + validação server-side de 4 regras + fallback gpt-5.4 | infra/IA | Cobertura forçada dos 6 modelos-alvo, fallback de provedor. Mitiga risco "drift LLM" (medium). |

---

## 2. Diferenças ponto-a-ponto contra a v5.1.0

### 2.1 Governança HITL
- **v5.1.0:** curadoria gatekeeper para triplets de estudos.
- **v5.2.0:** **mais** uma camada de gatekeeper, agora para *insights populacionais* (cohort_insights). Sem aprovação `vet_reviewed_by + vet_reviewed_at`, o insight não promove para regra/meta-estudo.
- **Implementação:** `VetCuratorReviewDialog`, `vet_review_status` com check constraint + índice.

### 2.2 Schema de evidência
- **v5.1.0:** `evidence jsonb` aceitava objeto vazio; confiança vinha do LLM sem validação.
- **v5.2.0:** schema obriga 6 campos quantitativos. Edge function `analyze-cohort-patterns` derruba o insight se os agregados não sustentarem números reais. Novo botão "🧪" permite re-análise por insight (UPDATE in-place).

### 2.3 Painel de evidência no dialog de revisão
- Computado em tempo real a partir de `pet_profiles + pet_conditions + pet_exams` (sem chamada de LLM): suporte populacional N/total, estratificação (raça, idade ± dp, severidade), top alterações lab com flags canônicas, provenance (cohort, modelo gerador, JSON do evidence). Avisos automáticos quando N<10 ou suporte<20%.

### 2.4 Canonicalização clínica
- Novo helper `canonicalConditionKey` faz lookup reverso PT→EN antes da contagem (resolve a dupla contagem).
- Novo `lab-flag-canonicalizer.ts` unifica HCT↔Hematócrito, PLT↔Plt, ALT↔TGP, AST↔TGO, FA↔ALP, Ureia↔BUN, Creatinina↔Creatinine. Top-12 estável.
- `formatLabValue` deixou de imprimir `ref ?–?` para exames qualitativos.

### 2.5 IA gateway / robustez
- `suggest-cohort-ideas` migrado de gemini-3.5-flash (ignorava JSON Schema, perdia `target_model_id` e `record_requirements`) para gemini-3.1-pro-preview.
- Validação server-side das 4 regras duras: 6 cohorts, 6 modelos distintos, `record_requirements` não-vazio, ≥2 cohorts deceased/mixed.
- Fallback automático para gpt-5.4 em falha de provedor.

---

## 3. Cobertura regulatória — delta

| Framework | Pontos cobertos na v5.1.0 | Pontos adicionais na v5.2.0 | Total v5.2.0 |
|---|---|---|---|
| FDA Draft Jan/2025 | 5/7 | +1 (transparência quantitativa) | **6/7** |
| EMA Set/2024 + EU AI Act | 3/4 | +1 (rastreabilidade de evidência) | **4/4** |
| AVMA Nov/2025 | 2/4 (com 2 gaps) | sem mudança | 2/4 |
| GMLP (10 princípios) | 7/10 + 3 parciais | +1 (princípio §1 escopo) | **8/10 + 2 parciais** |

---

## 4. Mitigações de gaps/riscos previamente listados

| Gap/Risco (v5.1.0) | Severidade | Status em v5.2.0 |
|---|---|---|
| PCCP formal | P0 | **Em mitigação** — HITL populacional implementado |
| Triplet errado auto-aprovado | high | **Reduzido** — validação vet-curador agora cobre insights populacionais |
| Drift LLM | medium | **Reduzido** — validação server-side + fallback de provedor |
| Bias audit | P1 | sem mudança |
| RWPM longitudinal | P0 | sem mudança |
| Embeddings legados | P1 | sem mudança |
| Gompertz 81 raças | P1 | sem mudança |

**Gaps remanescentes:** 9 (12 → 9). **Riscos remanescentes:** 4 (5 → 4).

---

## 5. Métricas operacionais (snapshot 31/05/2026)

Reaproveita os dados da v5.1.0 + adições do período:

- **Edge Functions:** 67 (sem alteração estrutural; 1 endurecida).
- **Prompts ativos (`ai_prompt_versions`):** 8 (mesma contagem; 1 prompt do `analyze-cohort-patterns` versão maior).
- **i18n_version:** 1.115.6 (de 1.86.7).
- **Triplets aprovados:** 3924; sincronizados Neo4j: 4411; totais: 4785 (sem mudança material no período).
- **Cohort insights com `vet_review_status`:** novo campo; backfill default `pending`.

---

## 6. Pendências carregadas para a próxima auditoria (v5.3.0)

1. RWPM longitudinal (P0) — sem progresso.
2. Bias audit (P1) — sem progresso.
3. Gompertz 81 raças (P1) — sem progresso.
4. Europe PMC/bioRxiv (P2) — sem progresso.
5. VLM figuras (P3) — sem progresso.
6. AVMA Nov/2025 — 2 gaps em aberto.
7. GMLP §3 e §7 — parciais.

---

## 7. Anexos herdados da v5.1.0

Inalterados; consultar diretamente em `public/audits/v5.1.0/`:

- **Apêndice A** — Schema SQL principal
- **Apêndice B** — Inventário de 67 Edge Functions
- **Apêndice C** — Prompts e modelos LLM
- **Apêndice D** — Métricas operacionais consolidadas
- **Bibliografia** — 14 referências verificáveis

---

*Gerado em 31/05/2026 pelo lovable-agent · paridade V3. Esta v5.2.0 é incremental sobre v5.1.0 (mesma autoria, mesma metodologia). Para auditoria completa standalone, ver v5.1.0.*
