## Auditoria — Fundamentos Arquiteturais

Investiguei o banco, o `FundamentosTab.tsx` e os 3 subcomponentes (`MetaStudyKanban`, `IngestaoMetaEstudo`, `CoreRuleHistory`, `MetaStudyDetailedCard`, `MetaKgRoadmapCard`). Resultados resumidos antes do trabalho:

### (a) Auditoria dos 6 papers `architectural` (vínculos `core_rule_evidence`)

| Paper | RCs vinculadas | Análise |
|---|---|---|
| **A foundation model for clinician-centered drug repurposing (TxGNN, 2024)** | RC-001, RC-008, RC-013 | ✅ Cobertura razoável (exclusion≠contraindication, taxonomia, tiered governance) |
| **Anti-aging strategies in dogs (Geroscience, 2024)** | RC-003 | ⚠️ Único paper translacional; só 1 RC. OK para hoje. |
| **KGARevion (Su et al., 2025)** | RC-008, RC-014 | ✅ (já reclassificado para PARTIAL no card de pilares) |
| **MedGraphRAG (Wu, 2025)** | RC-008, RC-015 | ✅ Apropriado (chunking + taxonomia). Poderia ganhar RC sobre Triple Graph Construction. |
| **OptimusKG (2025)** | RC-008, RC-013 | ✅ |
| **Hetionet — Himmelstein 2017** | RC-008, RC-014 | ✅ (24 metaedges = base do dicionário de predicados) |

**Gap factual identificado:** TxGNN é citado em `AboutSenexTab` (card de honestidade arquitetural via OptimusKG `modulates_weight` na captura 4 do turno anterior), mas **não tem vínculo de evidência** com nenhuma RC sobre confidence-scoring/explainability. Não vou inventar vínculos — apenas registrar como sugestão na nota da auditoria.

### (b) Hard rules realmente aplicadas + estrutura de novas regras

18 RCs no banco:
- **15 com `runtime_effect='active'`** (vinculadas a código)
- **3 `doc_only`** (RC-001/002/018 — convenção, sem código)
- **0 `planned` ativas** (RC-003 está `planned`)

**Spot-check de "active" → existe código?**
- ✅ RC-014 (predicate normalization) → `supabase/functions/generate-triplets`
- ✅ RC-018 (is_demo) → encontrado em `generate-showcase`, `generate-audit`, `usePetProfile`
- ✅ RC-011 (soft delete) → migrações `deleted_at`
- ✅ RC-005 (bilinguismo), RC-006 (no-mock), RC-008 (SNOMED) → memórias core ativas

**Cobertura de evidência por RC:** 13 das 18 RCs (72%) têm **zero** estudo vinculado (RC-002, 004–007, 009–012, 016–018). Não é falha — várias são convenções internas (no-mock, soft delete, cap=8). Mas o painel "Justificativas" já marca isso corretamente como *"governança por convenção da equipe"*. Estrutura confiável.

**Estrutura para novas regras (pipeline de ingestão):** o `IngestaoMetaEstudo.tsx` (983 linhas) implementa promote/attach/discard com bloqueio para conflitos com RCs ativas (vide `blockedPromotions` na linha 344). Confiável. Não vou refatorar.

### (c) Strings PT-only na aba Fundamentos

**Confirmado:** `FundamentosTab`, `MetaKgRoadmapCard` e `MetaStudyDetailedCard` usam `t('chave', 'fallback PT')`, mas **TODAS as 35 chaves `fundamentos.*`** estão **ausentes em PT e EN** nos JSONs — então funcionam só pelo fallback PT. Em EN, tudo aparece em PT (vide capturas).

Adicionalmente:
- **CoreRuleHistory.tsx**: placeholder "Buscar por RC-ID..." e toast hardcoded em PT.
- **IngestaoMetaEstudo.tsx**: ~20 toasts/labels hardcoded em PT (stages, secciones, ações como "Promover para nova RC", "Manter RC atual", "Descartar", "✓ Anexar como evidência", placeholder grande na linha 588).
- **MetaStudyKanban.tsx**: dicionário de labels reliability em PT abreviado (linhas 80-84), e provavelmente outros pontos no arquivo de 730 linhas.
- **Banco — core_rules:**
  - RC-001, RC-002, RC-003: `justification_en` NULL → mostra justificativa em PT em EN.
  - Todas 18 RCs: `application_en` NULL → "Aplicação no código" sempre em PT (são strings técnicas de path, mas algumas têm português ex: "3 seções separadas").

---

## Plano de execução

### Passo 1 — i18n para `FundamentosTab.tsx` + `MetaKgRoadmapCard.tsx` + `MetaStudyDetailedCard.tsx` (cobre as 35 chaves dos prints)
Adicionar TODAS as 35 chaves `fundamentos.*` em `src/locales/pt/translation.json` e `src/locales/en/translation.json` (já uso atual com fallback). Sem mudança em componentes — já chamam `t()`.

### Passo 2 — Fix dos 3 subcomponentes com strings hardcoded
- **CoreRuleHistory.tsx**: trocar placeholder + toast por `t()`, adicionar chaves PT/EN.
- **MetaStudyKanban.tsx**: trocar labels reliability abreviadas hardcoded por `t()`, adicionar chaves.
- **IngestaoMetaEstudo.tsx**: trocar **toasts, labels de stages, labels de seções e botões de ação** por `t()` (não vou re-traduzir a UI inteira de 983 linhas — apenas o que tem texto visível ao usuário em PT). Adicionar chaves PT/EN.

### Passo 3 — Bilinguizar regras-core no banco (3 + 18)
Migration SQL com `UPDATE core_rules SET justification_en=...` para RC-001/002/003 e `UPDATE core_rules SET application_en=...` para todas as 18 (traduzir as anotações PT que existem; deixar paths em inglês quando já forem). Sem alterar schema (`title_en/justification_en/application_en` já existem).

### Passo 4 — Bump i18n + versão + changelog
- `I18N_VERSION` `1.118.4` → `1.118.5`
- `CHANGELOG.md`: marker `7.2.1` → `7.2.2` (PATCH — bug fix de i18n) + 1 entry em `[Unreleased]` (`area: admin · status: changed · i18n: 1.118.5`)
- `npm run sync:changelog`

### Não inclui (escopo fora)
- Não vou adicionar vínculos `core_rule_evidence` novos (você revisaria caso a caso).
- Não vou criar RCs novas (TxGNN-explainability fica como nota para uma próxima iteração curatorial).
- Não vou traduzir conteúdo extraído dos papers (key_claims/summary) — esses vêm em inglês direto do paper.
- Não vou refatorar o pipeline de ingestão.

### Critério de pronto
- Trocar UI para EN no canto superior direito e revisitar `/administrador?tab=fundamentos` → todas as 6 abas internas e cards aparecem 100% em inglês, incluindo titles/badges/placeholders/toasts.
- Justificativas das RC-001/002/003 aparecem em inglês quando lang=EN.
