# Regras-Core do Senex AI

> **O que é**: catálogo auditável de regras-core (princípios arquiteturais, clínicos e epistemológicos) que governam o comportamento do sistema.
> **Como usar**: toda decisão de prompt, schema, UI ou recomendação deve poder ser rastreada a uma RC. Sempre que o usuário e a IA combinarem uma regra importante, registre aqui.
> **Versionamento**: cada regra tem `version`. Mudanças quebradoras incrementam major (v2). Refinamentos incrementam minor.
> **Espelhamento**: este arquivo será sincronizado para a tabela `core_rules` (Fase 2) via `scripts/sync-core-rules.mjs`.

---

## RC-001 — Exclusão de trial ≠ Contraindicação

- **Categoria**: clinical-semantics
- **Versão**: 1.0
- **Criada em**: 2026-05-19
- **Status**: active
- **Justificada por**: discussão com o usuário (chat 2026-05-19) sobre o estudo PQQ humano que listou "Pregnancy and Nursing" e "Serious Chronic Diseases" como contraindicações, quando na verdade eram apenas critérios de exclusão do trial.

### Enunciado

Quando um estudo declara que uma população foi **excluída** do trial, isso significa que essa população **não foi estudada** (lacuna de evidência). Não significa que o composto seja contraindicado para essa população.

Contraindicação requer evidência **positiva de dano, risco ou recomendação explícita contra o uso**.

### Por quê

Misturar exclusão com contraindicação:
- Subestima populações elegíveis para tratamento (falso negativo terapêutico)
- Cria barreiras clínicas baseadas em ausência de dado, não em risco demonstrado
- Polui o KG com "contraindicações" que na verdade são lacunas

### Como aplicar

- **Stage 3 prompt** (`extract-study-entities`): instrução explícita ao LLM para classificar como contraindicação somente quando há linguagem de risco/dano. Critério de exclusão deve ir para `evidence_gaps` (Fase 2).
- **UI** (`ExtractedDataVisualization`): banner amarelo no topo da seção "Contraindicações" lembrando o curador desta distinção.
- **Curador humano**: ao revisar um estudo, sempre verificar se a "contraindicação" veio de seção de exclusão do método.

### Aplicação em código

- `supabase/functions/extract-study-entities/index.ts` → `getDefaultStage3SystemPrompt()`
- `src/components/administrador/estudos/visualization/ExtractedDataVisualization.tsx` → seção Contraindications

### Evidências sustentadoras

- _(vazio até a Fase 2 — meta-estudos serão vinculados quando o módulo de Fundamentos Arquiteturais estiver no ar)_

---

## RC-002 — Eventos adversos: negação explícita ≠ ocorrência

- **Categoria**: data-integrity
- **Versão**: 1.0
- **Criada em**: 2026-05-19
- **Status**: active

### Enunciado

Quando um estudo declara "no adverse events reported" / "nenhum evento adverso observado", o sistema deve registrar `side_effects = []` e marcar `explicitly_no_adverse_events = true`. Não criar uma entrada de evento adverso cujo conteúdo seja a própria negação — isso distorce contadores e badges.

### Aplicação em código

- `supabase/functions/extract-study-entities/index.ts` → pós-Stage 3 (normalização via `NEGATIVE_AE_REGEX`)
- `src/components/administrador/estudos/visualization/ExtractedDataVisualization.tsx` → seção Side Effects (badge verde "Sem eventos adversos reportados" quando aplicável)

---

## RC-003 — Translational Weighting Humano→Cão _(planejada — Fase 2)_

- **Categoria**: epistemology
- **Versão**: 0.1 (rascunho)
- **Status**: planned

### Enunciado (rascunho)

Evidências extraídas de estudos não-caninos (humanos, roedores, equinos) entram no `hybrid-recommendation` com peso `< 1.0` definido por domínio em `core_rule_modulators`. O peso por domínio é justificado por meta-estudos no `meta_studies` KG (ex.: Anti-aging strategies for dogs — translacionalidade humano→cão).

- Cognição: peso humano→cão sugerido = 0.7
- Metabolismo hepático: peso humano→cão sugerido = 0.4
- Articular/inflamação: peso humano→cão sugerido = 0.8

_(Valores finais virão do meta-KG na Fase 2.)_

---

## Convenções

- **ID**: `RC-NNN` sequencial, nunca reciclar.
- **Status**: `active` | `deprecated` | `superseded` | `planned`.
- **Quando arquivar**: nunca apagar uma RC. Marque como `deprecated` ou `superseded by RC-XXX` e mantenha o histórico.
- **Quem pode criar**: qualquer ciclo usuário↔IA que combine uma regra que afete prompts, schema, scoring, ou semântica clínica.
