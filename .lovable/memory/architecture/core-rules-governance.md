---
name: Core Rules governance via docs/CORE_RULES.md
description: Regras-core auditáveis vivem em docs/CORE_RULES.md (fonte canônica) e serão espelhadas para tabela core_rules na Fase 2.
type: architecture
---

**Source of truth**: `docs/CORE_RULES.md` (versionado em git).

**Mirror (Phase 2)**: tabela `core_rules` sincronizada via `scripts/sync-core-rules.mjs`, consultada pelo edge `hybrid-recommendation` para aplicar modulators (ex.: translational weighting).

**Auditoria**: tab "Fundamentos Arquiteturais" no admin (Fase 2) renderiza o MD + evidências vinculadas (meta_studies).

**Convenção de ID**: RC-NNN, nunca reciclar. Status: active | deprecated | superseded | planned.

**Quando criar uma RC**: sempre que o ciclo user↔IA combinar uma regra que governe prompts, schema, scoring, ou semântica clínica.