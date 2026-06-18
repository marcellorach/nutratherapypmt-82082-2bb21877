## Decisões consolidadas

1. **Localização**: tudo dentro de **Configurações → Prompts** (mesmo lugar onde já gerenciamos `SystemPromptsCatalog`, `PromptManagementPanel`, `TaskModelGovernancePanel`). Não cria sub-aba nova no nível superior — vira uma seção lateral/aba interna do painel de Prompts, com **dois botões independentes**:
   - **"Gerar relatório de prompts"** (já existe).
   - **"Gerar relatório de modelos"** (novo) → exporta CSV/JSON com `função · modelo real · alias`.
2. **Granularidade dos aliases**: **por tarefa**, não por família. O mesmo `gemini-2.5-pro` pode aparecer como "Modelo Clínico A" em recomendação e "Modelo de Curadoria B" em validação de triplets. Mais trabalho de seed inicial, mas alinha o rótulo ao contexto que o parceiro vê.
3. **Sem rodapé de anonimização** nos PDFs. Os relatórios externos simplesmente exibem o alias como se fosse o nome do modelo.

---

## Parte A — Inventário de modelos (read-only)

### A1. Edge function `model-inventory`
Coletor server-side que devolve, para cada `task_id` de `AI_TASKS`:
`{ task_id, edge_function, prompt_source, prompt_key, real_model, provider, governed, alias_label_pt, alias_label_en, notes }`.

Resolve modelo da mesma forma que o runtime:
- governadas → via `ai-task-router.ts` + `ai_prompt_versions` ativo;
- overrides inline (`generate-triplets`, `gemini-file-search`, `extract-meta-study`, etc.) → string literal do código, marcadas `governed=false`;
- **embeddings** → modelo + dimensão de `vectorize-study` + amostra de `study_embeddings`;
- **Perplexity** → modelo usado em `web-dosage-lookup`, `perplexity-health`, `kg-evidence-gap-fill`.

Snapshot persistido em nova tabela `ai_model_inventory_snapshots(id, captured_at, snapshot jsonb)` para auditoria temporal.

### A2. Integração com auditoria
`generate-audit` inclui bloco `model_inventory` (com aliases já aplicados nos campos públicos, real_model preservado em campo separado visível só a admin).

---

## Parte B — Aliases por tarefa

### B1. Tabela `ai_task_aliases`
```
task_id text pk            -- bate com AI_TASKS.id
real_model text not null   -- snapshot do modelo no momento do alias
alias_label_pt text not null
alias_label_en text not null
description text
updated_by uuid, updated_at timestamptz
```
RLS: select `authenticated`, write só `is_admin()`. Seed inicial cobrindo todas as tarefas de `AI_TASKS` + entradas especiais (`__embeddings__`, `__perplexity_search__`).

### B2. Helpers
- Server: `_shared/model-alias.ts` com `maskModelForTask(taskId, realModel)` e `loadAliasMap()`.
- Client: `useTaskAlias()` hook que carrega o mapa uma vez (React Query, cache 5 min).

### B3. Substituição em superfícies externas
Pesquisa global e troca literais de modelo por `mask()` em:

- **UI compartilhável**: `TaskModelGovernancePanel`, `TaskDetailSheet`, `AIModelSelector` (display), `EnginesPromptsPanel`, `PromptManagementPanel`, `PerplexityStatusCard`, `Footer`, `admin-tabs-info`, `prioritizationBoard`, painéis "Auditoria Técnica" / "Fundamentos Arquiteturais", `RagSmokeTestDialog`, `CohortAISuggester`, `SyntheticCohortsManager`.
- **Hooks com strings expostas**: `useAIConfig`, `useGeminiProcessing`, `useVetGraphRAGConfig`, `useProcessingLogic`.
- **Server**: `generate-audit`, `generate-showcase`, qualquer geração de PDF/markdown.

Mantêm nome real: arquivo `ai-tasks.ts`, router, edge logs do Supabase, e a nova tela de Inventário (interna).

### B4. UI dentro de Configurações → Prompts
Nova seção **"Modelos & Aliases"** com:
- Tabela: `tarefa · modelo real · alias PT · alias EN · categoria · última atualização`;
- Edição inline dos aliases (admin only);
- Botão **"Gerar relatório de modelos"** (CSV/JSON, separado do relatório de prompts);
- Botão **"Atualizar snapshot do inventário"** → chama `model-inventory`;
- Indicador visual para tarefas sem alias (fallback exibe "Modelo não-rotulado", nunca o nome real).

---

## Entregáveis

1. Migrations: `ai_model_inventory_snapshots`, `ai_task_aliases` (+ GRANTs e RLS).
2. Edge function `model-inventory`; integração em `generate-audit`.
3. Helpers `maskModelForTask` (server) e `useTaskAlias` (client).
4. Substituição global de literais de modelo nas superfícies da B3.
5. Seção **"Modelos & Aliases"** dentro de Configurações → Prompts, com seed inicial de aliases por tarefa e os dois botões de relatório independentes.
6. Tabela de inventário entregue no chat assim que o coletor rodar pela primeira vez.

i18n com bump de `I18N_VERSION`, entrada no `CHANGELOG.md`, atualização do `projectOrganograma.ts` e `npm run sync:changelog`.
