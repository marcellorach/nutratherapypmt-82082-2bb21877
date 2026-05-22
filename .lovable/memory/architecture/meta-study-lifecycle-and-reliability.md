---
name: Meta-Study Lifecycle & Reliability (Fase A)
description: meta_studies tem lifecycle_status (sandbox 5-estados) + 5 dimensões 0-5 de confiabilidade com overall calculado. Fase B (lições como entidades + tripletes arquiteturais) e Fase C (RAG do meta-KG) ainda pendentes.
type: architecture
---

**Lifecycle (`meta_studies.lifecycle_status`, enum `meta_study_lifecycle`)**:
`inbox` → `triaged` → `in_review` → `approved` → `archived`. Default = `inbox`. Mudança de estado via Kanban (`MetaStudyKanban.tsx`). Promoção a `approved` NÃO é gate: a aprovação real de regras continua via curadoria das `proposed_rules` em `IngestaoMetaEstudo`.

**Confiabilidade (0–5, numeric(2,1))**: 5 colunas — `reliability_methodology`, `reliability_evidence_base`, `reliability_applicability`, `reliability_reproducibility`, `reliability_relevance`. `reliability_overall` é coluna GENERATED STORED = média das preenchidas (ignora NULL). `reliability_suggested` JSONB para sugestões opcionais da IA (humano sempre confirma).

**UI**: aba "Sandbox / Kanban" em FundamentosTab + card `MetaKgRoadmapCard` no topo da Ingestão lembrando Fase B/C.

**Próximas fases (não fazer agora sem revisitar)**:
- Fase B: promover lições (architectural_patterns, methodological_recipes, anti_patterns_pitfalls etc.) de JSONB dentro de `meta_studies` para entidades em tabela própria + tripletes arquiteturais + vínculo bidirecional RC↔lição. Refactor estrutural.
- Fase C: pgvector/embedding sobre meta-estudos quando ≥30 estudos arquiteturais.
