## Problema observado

Os pets sintéticos estão sendo criados com `0 condições` e `0 exames` (ver Floquinho na captura). O schema do tool atual exige `conditions` e `exams`, mas o modelo está retornando arrays vazios e o código não rejeita — apenas insere o perfil "vazio". Além disso, faltam **consultas (anamnese)**, **medicações** e **notas clínicas**, que são justamente o que dá riqueza aos pacientes do "Gerar Pacientes de Exemplo".

E não existe nenhuma visão estatística do cohort dentro do card — só contagem total e status.

## O que vou fazer

### 1) Enriquecer geração (edge function `generate-synthetic-cohort`)

**Schema do tool ampliado** — cada pet sintético passa a ter:
- `conditions` (1–4, obrigatórias e não-vazias) com `severity`, `status` e `origin`
- `exams` (2–5) com `results_json` plausível e `flags_abnormal`
- `consultations` (1–3) com `days_ago`, `chief_complaint`, `clinical_exam`, `weight_kg_at_visit`, `body_condition_score`, `assessment`, `plan` — a última marcada `is_latest=true` (espelha SAMPLE_PETS / Luna, Rex etc.)
- `medications` (0–3) ligadas à consulta correspondente quando fizer sentido clínico
- `clinical_notes` (1–2 frases de anamnese livre, tipo "observation")
- `notes` (texto livre no perfil, estilo "Cavalier sênior multissistêmico…")

**Prompt reforçado**: pede coerência clínica (raça × idade × condições × labs), pede variabilidade entre pets, e — crucial — instrui o modelo a NUNCA retornar `conditions` vazio. Inclui 1 exemplo few-shot curto baseado em "Rex" (Labrador OA + obesidade).

**Validação server-side**: pet com `conditions.length === 0` é descartado antes de inserir, e o batch tenta um retry curto até atingir o `size` pedido. Loga `n descartados por estarem vazios`.

**Persistência ampliada**: além de `pet_profiles + pet_conditions + pet_exams`, agora também grava em `pet_consultations` (marcando a mais recente como `is_latest`), `pet_medications` (com `consultation_id`) e `pet_clinical_notes`. Conditions e exams passam a referenciar a consulta correspondente via `consultation_id` quando indicado.

**BATCH_SIZE reduzido** de 25 → 12: payload por pet ficou ~3× maior; mantém o timeout de 90s viável e ajuda o último batch a não estourar (que é onde sempre trava).

### 2) Estatísticas do cohort no card

Novo componente `CohortStatsPanel` exibido **dentro** do card de cada cohort `ready` (colapsável, fechado por padrão para não poluir):

- Demografia: idade média/mediana, peso médio, % macho/fêmea, % castrados
- Top 5 raças (barra horizontal)
- Top 8 condições com contagem + distribuição de severidade (mild/moderate/severe)
- Cobertura: % pets com ≥1 condição, % com ≥1 exame, % com ≥1 consulta, média de exames/pet
- Flags laboratoriais mais comuns (top 5)

Dados via 1 RPC nova `get_cohort_stats(cohort_id uuid)` que agrega tudo em SQL (mais barato que puxar 175 pets pro client). Retorna JSON.

### 3) Atualizar o `CohortPatientsDialog`

Mostrar as **consultas** (timeline) e **medicações** do pet, não só conditions+exams — para refletir o que agora é gerado.

### 4) Plumbing

- Migration: criar função `get_cohort_stats(uuid)` (SECURITY DEFINER, restrita a admin via `is_admin()`)
- i18n PT/EN: novas chaves em `prioritization.cohortStats.*` e `prioritization.syntheticExplorer.consultations` / `.medications`; bump `I18N_VERSION`
- CHANGELOG.md + organograma + sync

## Detalhes técnicos

**Arquivos editados**
- `supabase/functions/generate-synthetic-cohort/index.ts` — schema, prompt, batch size, validação, persistência ampliada
- `src/components/administrador/priorizacoes/CohortPatientsDialog.tsx` — mostrar consultas + medicações
- `src/components/administrador/priorizacoes/SyntheticCohortsManager.tsx` — embed `<CohortStatsPanel />`
- `src/i18n.ts`, `src/locales/{pt,en}/translation.json`
- `CHANGELOG.md`, `src/data/projectOrganograma.ts`

**Arquivos novos**
- `src/components/administrador/priorizacoes/CohortStatsPanel.tsx`
- `supabase/migrations/<ts>_cohort_stats_rpc.sql`

**Não muda**
- `synthetic_cohorts` schema, geração de sugestões (`suggest-cohort-ideas`), UI de "Gerador de sugestão", finalização de stalled, autenticação/RLS.

Posso seguir com a implementação?