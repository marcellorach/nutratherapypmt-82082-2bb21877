## Visão geral

Quatro frentes integradas:

1. **(a) Auditoria** — confirmar/registrar onde predisposições efetivamente influenciam KG e análises.
2. **(b) Expansão de raças** — seed manual de ~120 raças com predisposições enriquecidas (perfil genético, fontes com link direto).
3. **(c) Revisão de condições** — expandir `health_conditions` com novas entradas bem documentadas + fontes.
4. **(d) Contadores reais na home** — substituir números fixos da landing por contagens reais + sufixo "(em contínua expansão)".

Tudo bilíngue PT/EN, com bump em `I18N_VERSION` e entrada no `CHANGELOG.md`.

---

## (a) Auditoria de interferência real das predisposições

Status atual mapeado no código:

```text
breed_predispositions  ──►  useBreedPredispositionsForPet
                              ├─► BiologicalTimeline (projeção de doenças)
                              ├─► clinical-analysis-pipeline (pipeline diagnóstico)
                              ├─► nutrition-gap-analyzer
                              └─► hybrid-recommendation (edge function)
                                   └─► usePetCompoundCoverage (KG: nutracêutico×condição)
```

**Confirmação**: predisposições ALIMENTAM:
- Timeline biológica do pet (risk_factor multiplica severidade projetada).
- Pipeline clínico (badge "Raça" como fonte de condição).
- Recomendação híbrida (edge function recebe predisposições e usa KG para sugerir compostos).
- Relations Auditor + Neo4j sync.

**Entrega**: um único arquivo `docs/BREED_PREDISPOSITIONS_AUDIT.md` listando cada ponto de consumo com link para o arquivo/linha, explicando como `risk_factor` e `evidence_grade` afetam o resultado final. Sem alterações de código nesta fase — apenas documentação. Se durante a auditoria detectar lacuna óbvia (ex.: campo coletado mas ignorado), abro **issue separada** em vez de corrigir no mesmo PR — para manter este plano focado em catálogo.

---

## (b) Expansão de raças — ~120 raças com fontes

### Schema (mudanças mínimas)

Adicionar colunas a `breed_predispositions` (migration):

- `genetic_profile TEXT` / `genetic_profile_en TEXT` — descrição do gene/variante (ex.: "MDR1 mutation (ABCB1-1Δ)", "COMMD1 deletion exon 2").
- `inheritance_pattern TEXT` — `autosomal_recessive | autosomal_dominant | x_linked | polygenic | unknown`.
- `prevalence_pct NUMERIC` — prevalência estimada na raça (quando disponível).
- `sources JSONB` — array de `{ label, url, type: 'omia'|'pubmed'|'akc'|'university'|'fci', citation }` com **link direto à publicação/registro**.

Manter `supporting_study_ids` para back-compat.

### Seed manual (JSON pré-validado)

Criar `supabase/seeds/breeds_v2.json` com ~120 raças cobrindo AKC/FCI mais relevantes + raças brasileiras (Fila, Terrier Brasileiro). Para cada raça: ~3–8 predisposições com:

- Nome PT/EN da condição (resolvido por `name`/`name_en` existente em `health_conditions`).
- `risk_factor`, `evidence_grade`, `prevalence_pct`.
- `genetic_profile` quando documentado (ex.: Collie + MDR1 → ABCB1-1Δ).
- 1–3 fontes com URL direta:
  - **OMIA**: `https://www.omia.org/OMIA000XXX/9615/`
  - **PubMed**: `https://pubmed.ncbi.nlm.nih.gov/<PMID>/`
  - **UC Davis VGL / Cornell DNA**: links de página de teste/condição.
  - **AKC / FCI**: páginas oficiais de padrão de raça.

Aplicar via migration `INSERT ... ON CONFLICT (breed_id, condition_id) DO UPDATE` para idempotência. Condições que ainda não existirem entram primeiro no passo (c).

### UI

`BreedPredispositionsPanel.tsx` ganha:
- Linha extra por predisposição com chips: `Perfil genético`, `Herança`, `Prevalência`.
- Lista de **fontes clicáveis** (`<a target="_blank" rel="noopener">`), ícone por tipo (OMIA/PubMed/AKC).
- Strings PT/EN em `translation.json`.

---

## (c) Revisão de `health_conditions`

Auditar as 109 condições atuais e **adicionar ~40–60 novas** focando em condições crônicas/degenerativas caninas bem documentadas (ex.: SARDS, Degenerative Myelopathy, Exocrine Pancreatic Insufficiency, Atopic Dermatitis subtipos, Cushing iatrogênico, Discoespondilose, Síndrome Vestibular Geriátrica, etc.).

Adicionar coluna `sources JSONB` em `health_conditions` (mesmo formato do (b)), populada para **todas as novas + as principais existentes** com links diretos para revisões/diretrizes (Merck Vet Manual oficial, WSAVA guidelines, ACVIM consensus statements, papers PubMed).

UI da aba "Condições Veterinárias" passa a renderizar bloco "Fontes" com links externos.

---

## (d) Contadores reais na home (`pet.longevidade.ai` + `longevidade.ai`)

`MarketSection.tsx` / `OpportunitySection.tsx` atualmente mostram "267 estudos, 35 compostos, 95 condições". Substituir por **hook `usePlatformCounts`** que faz `SELECT count` em:

- `scientific_studies` (aprovados)
- `nutraceuticals`
- `health_conditions`
- (opcional) `medications` se existir tabela de drogas; caso contrário, manter campo "Drogas" oculto até existir.

Render: `109 condições (em contínua expansão)`, `30 nutracêuticos (em contínua expansão)`, etc. Strings PT/EN com placeholder `{{count}}`. Fallback: se query falhar, esconder o número em vez de mostrar valor falso (no-mock policy).

---

## Modelos e pipeline de validação

- **LLM padrão para esta tarefa de curadoria/validação cruzada**: `google/gemini-3.1-pro-preview` (preview mais recente, melhor reasoning). Para fact-check em volume usar `google/gemini-3-flash-preview`.
- **Perplexity API** já está conectada (`PERPLEXITY_API_KEY`) → usar para validar URLs de fontes (PubMed/OMIA) antes de gravar no seed, garantindo links vivos e relevantes. Script de validação roda offline (não na app) via `code--exec` antes da migration.
- Como o seed é manual pré-validado, NÃO há edge function nova nesta entrega — apenas migrations + UI.

---

## Detalhes técnicos

**Migrations** (3, em ordem):
1. `add_sources_and_genetic_profile_to_breed_predispositions` — colunas + índice GIN em `sources`.
2. `add_sources_to_health_conditions` + insert das ~50 novas condições com bilingual + sources.
3. `seed_breeds_v2_120_breeds` — upserts em `breeds` e `breed_predispositions` a partir do JSON.

**Frontend**:
- `BreedPredispositionsPanel.tsx`: novos campos + lista de fontes.
- Aba "Condições Veterinárias": novo bloco "Fontes".
- `src/hooks/usePlatformCounts.ts` (novo).
- `MarketSection.tsx`/`OpportunitySection.tsx`: consomem hook + chave de tradução com sufixo "em contínua expansão" / "continuously expanding".
- `src/i18n.ts`: bump de versão.
- `src/locales/pt|en/translation.json`: novas chaves.

**Documentação**:
- `docs/BREED_PREDISPOSITIONS_AUDIT.md` (novo, entrega da letra a).
- `CHANGELOG.md`: entrada em `[Unreleased]` com tags `area: data-catalog · status: shipped · i18n: bumped`.
- `ARCHITECTURE.md` MINOR bump (novas colunas + nova fonte de verdade para contadores).
- `docs/CURRENT_STATE.md` MINOR bump.

**Testes**:
- Vitest unitário para `usePlatformCounts` (fallback quando query falha).
- Validação de schema do JSON de seed (`scripts/validate-breeds-seed.mjs`).

---

## Ordem de execução

1. Auditoria (a) → entrega o doc.
2. Migration de schema (colunas `sources`, `genetic_profile`, etc.).
3. Insert das ~50 novas condições com fontes.
4. Seed das ~120 raças + predisposições (depende de 3).
5. UI: painel de raças + aba condições + home counters.
6. i18n bump + changelog + sync.

Sem mudanças de design ou em outras páginas além das mencionadas.