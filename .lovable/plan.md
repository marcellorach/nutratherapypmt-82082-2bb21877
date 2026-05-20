# Plano — Estudos: Polimento, Governança e Meta-KG

## Fase 1 — Polimento imediato do card/modal de estudos

### 1.1 Renomear "Sem trechos indexados" e adicionar tooltip (item a)
- Label vira **"RAG não indexado"** (PT) / **"RAG not indexed"** (EN), com tooltip:
  > "Este estudo ainda não foi vetorizado. O curador não verá o 'Trecho de Origem'. Reprocessar para habilitar."
- Adicionar botão **"Reprocessar vetorização"** que chama `vectorize-study`.
- Arquivos: `EstudoCard.tsx`, `pt/translation.json`, `en/translation.json`.

### 1.2 Timeline de timestamps (item b)
- **Migração**: adicionar `curated_at TIMESTAMPTZ`, `curated_by UUID` em `processed_studies`.
- Nova seção **"Linha do tempo"** no modal e linha compacta no card:
  - Publicação (`publication_year`) → Ingestão (`created_at`) → Stage 1/2/3 (`processed_at` + flags) → Vetorização (max `study_embeddings.created_at`) → Curadoria (`curated_at`).
- Componente `StudyTimeline.tsx` em `detalhes/`.

### 1.3 Bilinguismo completo (item c)
- Auditoria do `EstudoCard.tsx` + `AnaliseTab.tsx` + `ExtractedDataVisualization.tsx`: substituir todo hardcoded por `t()`.
- Dicionário PT de normalização de **valores enum vindos do LLM**: `moderate→moderado`, `low→baixo`, `caution→cautela`, `relative→relativa`, `double blind→duplo-cego`, `Human→Humano`, `12 weeks→12 semanas`, etc. — arquivo `src/utils/llmEnumLocalizer.ts`.
- Bump `I18N_VERSION` em `src/i18n.ts`.

### 1.4 Scores clicáveis com critérios detectados (item d)
- Cada card (Qualidade Metodológica / Relevância Clínica / Novidade Científica) vira clicável.
- Popover/modal exibe os critérios que entraram no cálculo, com ✓/✗ e peso:
  - **Qualidade**: RCT (✓/✗), n≥30 (✓/✗), randomização, cegamento, placebo-controlado, p<0.05, duração ≥12 semanas, conflito de interesse declarado.
  - **Relevância**: espécie canina (✓/✗), translacional humano→cão, dose realista, via oral, condição alvo metabólica/degenerativa.
  - **Novidade**: ano de publicação, originalidade do mecanismo, primeira evidência em espécie.
- Dados já estão em `analysis_data.study_assessment`; UI nova: `ScoreCriteriaPopover.tsx`.

### 1.5 Fix "Efeitos Adversos (1)" vazio (item e)
- Em `extract-study-entities`, detectar quando o único item de adverse events tem semântica negativa (`no adverse events`, `none reported`, `not observed`).
- Setar `adverse_events_count = 0` + flag `explicitly_none_reported: true`.
- UI: badge verde "Sem eventos adversos reportados" em vez de contador "(1)".

### 1.6 Separar Exclusão vs Contraindicação vs Lacuna (item f) — REGRA-CORE
- Novo schema em `analysis_data`:
  ```
  exclusion_criteria: []        // quem foi excluído do trial
  contraindications: []         // contraindicação demonstrada
  evidence_gaps: []             // população não estudada
  ```
- Atualizar prompt do Stage 3 com instrução explícita: "Critério de exclusão NÃO é contraindicação."
- UI: três seções distintas no modal, cores e ícones diferentes.
- Adicionar à `CORE_RULES.md` (ver Fase 2.1).

### 1.7 Atualização documental obrigatória
- `CHANGELOG.md` (entry com `<!-- area: estudos · status: shipped · i18n: 1.87.0 -->`).
- `npm run sync:changelog`.

---

## Fase 2 — Governança de regras-core + Meta-KG arquitetural

### 2.1 Fonte canônica: `docs/CORE_RULES.md` (item f.1)
Estrutura:
```markdown
# Regras-Core do Senex AI

## RC-001 — Exclusão ≠ Contraindicação
- Categoria: clinical-semantics
- Criada em: 2026-05-19
- Justificada por: [discussão usuário, este turno]
- Evidência sustentadora: (vazio até Fase 2.3)
- Aplicação: extract-study-entities Stage 3 prompt, UI de detalhes do estudo

## RC-002 — Vetorização é pré-curadoria
...
```
Cada regra: `id`, `título`, `categoria`, `data`, `versão`, `justificativa`, `aplicação` (arquivos/funções afetados), `evidências` (lista de meta_studies).

### 2.2 Tabela espelhada `core_rules` + `core_rule_evidence`
Migração:
```sql
core_rules (id, code, title_pt, title_en, body_pt, body_en, category, version, is_active)
meta_studies (id, title, authors, year, doi, pdf_storage_path, kind)
  -- kind ∈ ('architectural','methodological','translational','epistemological')
core_rule_evidence (rule_id, meta_study_id, relationship, weight)
  -- relationship ∈ ('SUPPORTS','CONTRADICTS','MODULATES','INSPIRES')
core_rule_modulators (rule_id, domain, source_species, target_species, weight, evidence_study_id)
  -- ex: ('translational_cognition','human','canine',0.7, <id>)
```
Script `scripts/sync-core-rules.mjs` lê `docs/CORE_RULES.md` e sincroniza para a tabela (igual ao `sync-changelog`).

### 2.3 Tab "Fundamentos Arquiteturais" no admin
- Nova entrada em `src/config/admin-tabs.ts` (grupo "Governança").
- Página com 3 abas:
  - **Regras-Core**: lista + detalhe (renderiza MD + evidências linkadas).
  - **Meta-Estudos**: upload PDF + extração leve (título, autores, ano, key claims). Armazena em bucket `meta_studies_pdfs`.
  - **Mapa de Influências**: KG visual (force-graph 2D) ligando MetaStudy → CoreRule → Module afetado.
- Atualizar `src/data/projectOrganograma.ts`.

### 2.4 Seeding: ingerir PDF "Anti-aging strategies for dogs"
- Copiar `user-uploads://Anti-aging_strategies_for_dogs-_current_insights_and_future_directions_copy_2.pdf` para bucket.
- Extrair metadados e 5-10 key claims via Gemini.
- Criar registro `meta_studies` com `kind='translational'`.
- Vincular a **RC-003 — Translational Weighting Human→Canine** (relationship: `SUPPORTS`).

### 2.5 Translational Weighting no hybrid-recommendation (item f-final)
- `hybrid-recommendation` consulta `core_rule_modulators` quando triplet vem de estudo não-canino.
- Lookup: `(domain=condition.domain, source_species=study.species, target_species='canine')` → `weight`.
- Multiplica `confidence` do triplet por `weight` antes de entrar no score final.
- UI mostra badge "Translação humano→cão: ×0.7 (RC-003)" com link para a regra.
- Para o estudo PQQ humano: cognição translaciona razoavelmente; metabolismo hepático translaciona pior.

### 2.6 Atualizar memória interna
- `mem://principles/exclusion-vs-contraindication` (nova).
- `mem://architecture/core-rules-governance` (nova).
- `mem://architecture/meta-kg-translational-weighting` (nova).
- Atualizar `mem://index.md`.

---

## Detalhes técnicos relevantes

**Arquivos novos**: `src/components/administrador/estudos/detalhes/StudyTimeline.tsx`, `src/components/administrador/estudos/detalhes/ScoreCriteriaPopover.tsx`, `src/utils/llmEnumLocalizer.ts`, `src/pages/administrador/FundamentosTab.tsx`, `docs/CORE_RULES.md`, `scripts/sync-core-rules.mjs`.

**Edge functions tocadas**: `extract-study-entities` (Stage 3 prompt + adverse events normalization), `hybrid-recommendation` (translational weighting), `ingest-meta-study` (nova, ingestão leve de PDFs arquiteturais).

**Migrações**: (1) `processed_studies + curated_at/by`; (2) `core_rules`, `meta_studies`, `core_rule_evidence`, `core_rule_modulators` + RLS admin-only; (3) bucket `meta_studies_pdfs`.

**Riscos**: Fase 2.5 muda confidence scoring — preciso validar que isso não degrada recomendações existentes. Solução: feature flag `enable_translational_weighting` inicialmente off, ativada após validação manual de 3-5 pets demo.

**Estimativa de turnos**: Fase 1 ≈ 2-3 turnos. Fase 2 ≈ 3-4 turnos. Total 5-7 turnos.
