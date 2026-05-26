
# Plano: Análise de Padrões de Cohort — Transparência, Reuso e Drill-down

Vamos atacar tudo em 4 fases pequenas e independentes para não travar nada. Tudo continua usando dados reais do cohort (sem mocks) e Lovable AI (`google/gemini-3.5-flash`).

## Fase 1 — Visibilidade e controle da análise (resolve a, b, c)

**a) Log de execução da análise de padrões**
- Adicionar coluna `analysis_log jsonb` em `synthetic_cohorts` (mesmo padrão de `progress_log`).
- `analyze-cohort-patterns` passa a gravar eventos estruturados: `started → loading_pets (n=X) → loading_conditions → loading_exams → aggregating → calling_llm (model, prompt_tokens) → parsing → inserting (n_insights) → done` (ou `error`).
- Cada card em "Cohorts sintéticos" ganha um collapsible "Log da análise (N)" igual ao log de geração — ao lado de "Estatísticas".

**b) Botão "Analisar padrões" inteligente**
- Adicionar `last_analyzed_at timestamptz` e `last_analysis_insights_count int` em `synthetic_cohorts`.
- Depois de analisado: botão fica "Re-analisar (X insights, há 3h)" com tooltip explicando que re-rodar pode gerar novos insights (LLM não é determinístico) e duplicar entradas. Confirmação modal antes de re-rodar.
- Opção `force=true` no payload; sem ela, o backend devolve 409 se já houver insights recentes (<24h) sem `force`.

**c) Modelo visível**
- Mostrar `google/gemini-3.5-flash` (vindo de `source_model` da resposta) no card do cohort durante e após análise — não só no role `platform_architect`. Badge pequeno: `🤖 gemini-3.5-flash`.
- Mesmo badge nos cards de insights em Population Insights (já existe `source_model` na tabela, só renderizar).

## Fase 2 — Drag-and-drop nos kanbans (resolve d)

- Instalar `@dnd-kit/core` + `@dnd-kit/sortable` (mesma stack já familiar ao projeto).
- Aplicar em:
  - **PrioritizationBoard** (Kanban de Priorizações) → arrastar entre `backlog/next/in_progress/in_test/done`. Persistir em `prioritizationBoard.ts` não dá (é estático); então criar tabela `prioritization_overrides (card_id, status, order)` para guardar a posição editada por admin. Fallback ao default se não tiver override.
  - **PopulationInsightsV0** → arrastar entre `discovery/hypothesis/proposed_meta_study/approved`. Já existe `UPDATE cohort_insights SET stage` — só trocar o `<select>` pelo drag.

## Fase 3 — Originalidade documentada para cohorts e insights (resolve e, i)

A reinterpretação do usuário muda o uso: **encontrar estudos confirmatórios é positivo** (reforça o KG); só não devemos gerar pedido de meta-estudo duplicado.

- Reaproveitar a função `check-cohort-originality` já criada (suggestions) e generalizá-la para receber `{kind: 'cohort'|'insight', id, title, signals}`.
- Disparar automaticamente após:
  - geração de cohort (`generate-synthetic-cohort` no final) — usa o nome + rationale + critérios.
  - geração de insights (`analyze-cohort-patterns` no final, para cada insight) — usa title + signals.
- Persistir em colunas novas em `synthetic_cohorts` e `cohort_insights`:
  - `originality_score numeric`
  - `originality_breakdown jsonb` (queries usadas, hits PubMed, top 3 títulos com link, hits internos, perplexity opcional)
  - `originality_checked_at`, `originality_status`
- UI: badge clicável "Confirmado por N estudos" (score baixo = bom para validação) ou "Inédito" (score alto = candidato a meta-estudo). Popover mostra: queries exatas, fontes consultadas, top 3 estudos clicáveis, e ressalta "Estudos recentes (<2 anos) podem não estar indexados".
- Em insights `proposed_meta_study`: se originalidade < 30, sugere converter para `approved` ao invés de novo meta-estudo, com botão "Marcar como confirmado por literatura existente".

## Fase 4 — Análise cross-cohort e drill-down (resolve f, g, j)

**f) Provar que os agentes leem dados reais:**
- O log da Fase 1 + o objeto `evidence` em cada insight já vêm do cohort. Adicionar no popover do insight uma seção "Cálculo verificável" mostrando: query SQL equivalente + número exato (ex.: `83.3% = 50/60 cães com idade ≥ 8a`) recalculada em tempo real ao abrir.

**g) Análise de TODOS os cohorts juntos:**
- Nova action no header de "Cohorts sintéticos": **"Meta-análise transversal"** (agrega N cohorts selecionados).
- Novo edge function `analyze-meta-cohort` que agrega pets de múltiplos `cohort_id`s, dedupe por raça/idade, e roda mesmo prompt do `analyze-cohort-patterns` com escopo expandido. Persiste insights com `cohort_id = null` + `scope = 'cross_cohort'` (nova coluna).
- Population Insights ganha filtro "Origem: cohort único / cross-cohort / todos".

**j) Drill-down dos insights:**
- Cada insight ganha um botão "Investigar →" que abre um Dialog em tela cheia com:
  - **Header**: título + evidência verificável recalculada.
  - **Charts** (Recharts, dados reais do cohort):
    - Distribuição por idade (histograma do `pet_profiles.age_years` do cohort).
    - Distribuição por raça (barras).
    - Prevalência das `signals` (ex.: ALT, FA) — flags abnormais por idade.
    - Scatter age × marcador quando aplicável.
  - **Lista estratificável**: tabela paginada de pets que satisfazem o padrão, com filtros (raça/idade/sexo/severidade). Click no pet abre `CohortPatientsDialog` já existente.
  - **Cálculo bruto**: linha por linha (id do pet, idade, raça, valor do marcador, contribui? sim/não).
  - **Originalidade**: bloco da Fase 3 inline.
  - **Ações**: mover de estágio, "Confirmado por literatura", "Promover a meta-estudo", "Exportar CSV".

## Detalhes técnicos

- **Migrações:**
  - `synthetic_cohorts`: + `analysis_log jsonb`, `last_analyzed_at`, `last_analysis_insights_count`, `originality_score`, `originality_breakdown`, `originality_checked_at`, `originality_status`.
  - `cohort_insights`: + `originality_score`, `originality_breakdown`, `originality_checked_at`, `originality_status`, `scope text default 'cohort'`, `source_cohort_ids uuid[]`.
  - `prioritization_overrides` (nova): `card_id text pk`, `status text`, `order int`, `updated_at`. RLS: admin only.
- **Edge functions:**
  - editar `analyze-cohort-patterns` (log + force flag + dispara originality).
  - editar `generate-synthetic-cohort` (dispara originality no final via `EdgeRuntime.waitUntil`).
  - editar `check-cohort-originality` (aceitar `kind`/`scope` genéricos).
  - novo `analyze-meta-cohort`.
- **Componentes novos/editados:**
  - `CohortAnalysisLog.tsx` (collapsible reaproveitando estilo do `CohortProgressLog`).
  - `InsightDrillDownDialog.tsx` (Fase 4).
  - `OriginalityBadge.tsx` generalizado a partir de `CohortOriginalityBadge.tsx`.
  - `SyntheticCohortsManager.tsx`, `PopulationInsightsV0.tsx`, `PrioritizationBoard.tsx` (dnd).
- **i18n:** PT/EN paritário, com bump de `I18N_VERSION` em `src/i18n.ts`.
- **CHANGELOG.md + organograma + `npm run sync:changelog`** como sempre.

## Ordem sugerida de entrega
1. Fase 1 (visibilidade) — pequena, te dá feedback imediato pra testar.
2. Fase 2 (drag-and-drop) — isolada.
3. Fase 4 drill-down (sem cross-cohort) — alto valor visual.
4. Fase 3 originalidade — depende do toggle Perplexity ser opcional (já está).
5. Fase 4 cross-cohort — última, pois depende de tudo acima.

Posso entregar **Fase 1 + Fase 2 num único turno** (já desbloqueia a, b, c, d e a maioria da observabilidade), e seguir com as outras nos próximos. Confirma que faço assim?
