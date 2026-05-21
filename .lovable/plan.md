# Senex AI 6.0 — Fechamento da Governança IA + Gêmeos Digitais Anatômicos

## Por que 6.0

Nos últimos dias entregamos uma mudança **estrutural**, não incremental: a plataforma ganhou um eixo de **Fundamentos Arquiteturais** (Regras-Core deduzidas/induzidas, meta-estudos digeridos com governança de conflito, audit log por RC) e um eixo de **Governança IA por Tarefa** (registro central de prompts × modelos, editor com teste A/B, router universal, logging por invocação). Isso justifica bump para `senex: 6.0.0`.

## Parte A — Revisão do que falta fechar (Governança IA)

### Status real hoje

- **Fase 1 (registro central)** — ✅ entregue. Painel "Modelos & Prompts por Tarefa" no admin.
- **Fase 2 (editor + A/B + histórico)** — ✅ entregue. `TaskDetailSheet` + `ai-task-test` + RPC de ativação.
- **Fase 2.5 (router universal + cobertura total)** — 🟡 parcial. **7 tarefas conectadas, 13 legacy, 3 planejadas.** Faltam 13 edge functions migrar para `callAITask()`.
- **Fase 3 (aba Tutorial)** — ✅ entregue (`AIGovernanceTutorialTab`).
- **Fase 4 (healthcheck diário)** — ❌ não iniciado. Sem cron e sem badge "Falhando".

### O que entra no 6.0

1. **Migrar as 13 legacy restantes** para o router (lote por área, com fallback preservado):
   - Curadoria/KG: `extract-meta-study`, `extract-study-entities`, `generate-triplets`, `gemini-file-search`, `consolidate-knowledge-graph`, `kg-evidence-gap-fill`.
   - Pet/Clínica: `extract-pet-clinical-data`, `parse-pet-exam-pdf`, `condition-insights`, `hybrid-recommendation`.
   - Catálogo: `enrich-pet-food-product`, `process-nutraceutical-spreadsheet`, `web-dosage-lookup`.
2. **Seed dos prompts faltantes** em `ai_prompt_versions` (v1, `source='migrated'`) extraídos do código atual de cada função, para que a edição passe a funcionar sem deploy.
3. **Fase 4 — Healthcheck**: edge `ai-task-healthcheck` (cron diário) + badge vermelho "Falhando" + KPI "X de Y tarefas saudáveis" no topo do painel.
4. **Smoke test consolidado**: script admin (botão "Rodar smoke") que invoca cada tarefa conectada com input mínimo e mostra latência/custo — usado como gate antes da Stanford.
5. **Documentação**: bump de versão para 6.0.0 em `ARCHITECTURE.md`, `docs/CURRENT_STATE.md`, `docs/STANFORD_DEMO.md`, marcador `<!-- senex: 6.0.0 -->` no `[Unreleased]` do `CHANGELOG.md`, entrada estruturada descrevendo o fechamento, `npm run sync:changelog`.

## Parte B — Dar vida ao Gêmeo Digital (anatomia canina realista)

Hoje `DigitalTwinDog` + `DogAnatomySVG` usam SVG estilizado próprio (silhueta + 12 regiões coloríveis). Funciona para tingir órgãos por doença, mas é "plano" e pouco impressionante para banca.

### Opções avaliadas

| Fonte | Licença prática | Encaixe técnico | Veredito |
|---|---|---|---|
| **BioRender MCP** (link enviado) | Conteúdo pago; export é para uso editorial/educacional do *assinante* — **não há licença web-app embeddable**. MCP é só para gerar figuras dentro do BioRender. | Não há SDK de runtime para incorporar a arte gerada em aplicação SaaS. | ❌ Não usar como fonte de assets embarcados. Pode ser usado por nós **manualmente** para gerar PNGs de referência (uso interno). |
| **Smart-Servier Medical Art** (humana, CC-BY 3.0) | ✅ permissiva, atribuição. | Útil para órgãos isolados (fígado, rim, coração). Não é canino. | ✅ Banco de órgãos genéricos com atribuição. |
| **Anatomography / BodyParts3D** (humano, CC-BY-SA 2.1 JP) | ✅ permissiva. | Modelos 3D OBJ/STL de órgãos. | ✅ Para visões 3D de órgãos individuais. |
| **Sketchfab — modelos caninos CC** (busca `dog anatomy license:cc`) | Varia por autor; filtrar `CC-BY` / `CC0`. | glTF/GLB → carregamento direto via `three`/`react-three-fiber` (já temos `three` no projeto). | ✅ **Melhor caminho** para corpo canino completo. |
| **Zygote / Visible Body / 3D4Medical** | Licenças comerciais caras, sem self-serve. | Top qualidade. | ⏸ Considerar depois da banca, caso haja patrocínio. |
| **AI generativo (Gemini 3 image / Imagen)** | OK para ilustrações 2D estilizadas próprias. | Não gera modelos 3D editáveis. | ✅ Útil para *skins* 2D consistentes em estilo (substitui o SVG atual por uma série de PNGs anatômicos próprios e licença clara). |

### Recomendação técnica (entra no 6.0)

**Pipeline híbrido em dois passos**, sem dependência de licença BioRender:

1. **Skin 2D melhorada (curto prazo, baixo risco)**: gerar com Imagen/Gemini 3 uma série de ilustrações anatômicas de cão em vista lateral com camadas separadas (silhueta, esqueleto, sistema digestivo, urinário, articular, cardio, nervoso). Salvar em `src/assets/anatomy/` como PNG transparente. Substituir o atual SVG inline por componente `<DogAnatomyLayered>` que cross-fade entre camadas conforme a doença ativa. Mantém performance e ganha realismo imediato.
2. **Vista 3D opcional (Phase 6.1)**: integrar **react-three-fiber** + `<Canvas>` com um modelo canino glTF CC-BY de Sketchfab carregado via `useGLTF`. Toggle "2D ⇄ 3D" no painel do twin. Highlight de órgãos por `traverse` + mudança de material, alimentado pelo mesmo mapa `anatomy-region-map.ts`. Não bloqueia o 6.0 — fica como spike adicional.

### Camadas iniciais a gerar (Passo 1)

`body_silhouette`, `skeleton`, `heart_lungs`, `liver_gi`, `kidneys_urinary`, `joints_hips`, `brain_spine`, `endocrine_pancreas`, `skin_coat`. Cada uma como PNG 1536×1024 transparente, estilo "ilustração científica clean, traços finos pretos, fill pastel" (alinhado ao design system).

## Parte C — Sugestões de próximos passos (pós-6.0)

1. **Cron de healthcheck + alertas Slack** quando uma tarefa fica vermelha por >2 ciclos.
2. **Custo acumulado por tarefa/dia** (view materializada sobre `ai_task_invocations`) com gráfico no painel.
3. **Versionamento de Regras-Core** (`version`, `superseded_by`, `rc_revisions`) — já marcado como próxima fase no changelog do dia 20.
4. **Vista 3D do twin** (item B.2 acima) com toggle 2D/3D.
5. **"Replay" do pipeline** numa consulta: ver exatamente qual prompt × modelo × versão foi usado em cada etapa daquele pet (já temos `ai_task_invocations`; falta link no Prontuário).
6. **Exportar pacote demo Stanford**: PDF gerado a partir do organograma + changelog + screenshots do twin e do painel de governança.

## Risco e mitigação

- **Migração das 13 legacy**: trabalho mecânico, fallback preservado, baixo risco. Smoke test obrigatório por lote.
- **Modelos 3D Sketchfab**: licença varia — fixar lista final com URLs e nomes dos autores em `docs/ASSET_LICENSES.md` antes de subir.
- **Geração de PNGs anatômicos**: validar visualmente antes de commitar; manter `body_silhouette` atual como fallback caso o estilo gerado não case.

## Sequência sugerida (ordem de execução após aprovação)

1. Migrar lote Curadoria/KG (6 funções) + seed prompts + smoke.
2. Migrar lote Pet/Clínica (4 funções) + seed prompts + smoke.
3. Migrar lote Catálogo (3 funções) + seed prompts + smoke.
4. Healthcheck (cron + badge + KPI).
5. Gerar PNGs anatômicos e plugar `DogAnatomyLayered`.
6. Bump versão 6.0.0 em todos os docs + entrada `CHANGELOG.md` + `npm run sync:changelog`.

## Escopo (o que entra)

1. **Cobertura total** das ~25 edge functions que chamam IA hoje (não só 3).
2. **Router compartilhado** que toda função passa a usar.
3. **Badge "Conectado / Legacy / Planejado"** em cada task card para transparência.
4. **Nova aba `Tutorial`** dentro do admin com walkthrough passo-a-passo e screenshots anotados.
5. **Healthcheck automático** que roda 1×/dia e marca tasks cujo prompt/modelo ativo falha no Gateway.
6. **Smoke test end-to-end** antes de fechar cada fase.

## Fora de escopo

- Fase 3 radar (monitorar novos modelos OpenAI/Google automaticamente) — só deixamos o esqueleto da tabela.
- Chamar APIs dos provedores direto (sem Gateway).
- A/B testing automático em produção.

## Fase 2.5 — Router universal + cobertura completa

### 1. Router compartilhado

Criar `supabase/functions/_shared/ai-task-router.ts` com:

- `resolveTask(taskId)` → lê `ai_prompt_versions` (versão ativa) + `ai_configurations` (override de modelo) + fallback para `AI_TASKS` estático em `src/config/ai-tasks.ts`.
- `callAITask(taskId, { input, variables, overrides })` → executa a chamada ao Lovable AI Gateway já com prompt, modelo, `reasoning_effort`, `temperature`, e logging.
- Logging unificado em nova tabela `ai_task_invocations` (latência, tokens, custo, erro, função-origem).
- Cache in-memory de 30s para `resolveTask` (evita N reads por chamada).

### 2. Mapear cada edge function a um `task_id`

Adicionar em `src/config/ai-tasks.ts` as tasks que faltam (marcadas "novo"):

```text
chat                                -> clinical_chat_factual
document-chat                       -> clinical_chat_factual
extract-meta-study                  -> meta_study_analysis
extract-study-entities              -> extraction_stage1/2/3 (por estagio)
generate-triplets                   -> triplet_extraction
enrich-triplet                      -> triplet_enrichment       (novo)
gemini-file-search                  -> extraction_stage1
hybrid-recommendation               -> geroprotector_stack
project-pet-trajectory              -> trajectory_projection    (novo)
extract-pet-clinical-data           -> clinical_data_extraction (novo)
parse-pet-exam-pdf                  -> lab_pdf_parsing          (novo)
kg-evidence-gap-fill                -> kg_gap_fill              (novo)
relations-auditor                   -> relations_auditor
auto-tag-studies                    -> study_tagging            (novo)
translate-text                      -> translation_generic      (novo)
translate-conditions                -> translation_conditions   (novo)
translate-and-categorize-conditions -> translation_conditions
suggest-taxonomy-terms              -> taxonomy_suggestion      (novo)
web-dosage-lookup                   -> dosage_web_lookup        (novo)
enrich-pet-food-product             -> food_enrichment          (novo)
process-nutraceutical-spreadsheet   -> spreadsheet_enrichment   (novo)
vectorize-study                     -> embeddings_default       (categoria nova)
test-rag-similarity, provider-health -> (probes — pulam o router)
```

### 3. Migrar cada edge function

Trocar o `fetch` direto ao Gateway pela chamada `callAITask(taskId, ...)`. Manter o comportamento atual como fallback caso a task ainda não esteja semeada (zero quebra).

### 4. Semear prompts faltantes

Extrair o `systemPrompt`/`userPrompt` hardcoded atual de cada função e inserir em `ai_prompt_versions` como `version=1`, `is_active=true`, `source='migrated'`.

### 5. Badge de status no painel

Cada task card ganha:
- verde **"Conectado"** — função já usa o router e foi testada
- âmbar **"Legacy"** — task registrada mas função ainda não migrada
- cinza **"Planejado"** — task definida mas sem consumer ainda

## Fase 3 — Aba Tutorial dentro do Admin

Nova tab `tutorial-ia` em `src/config/admin-tabs.ts`, dentro do grupo **Sistema** (acima de Configuração IA). Conteúdo:

- **Onde fica**: screenshot anotado da sidebar mostrando "Sistema → Configuração IA → Modelos & Prompts por Tarefa".
- **Passo 1 — Visualizar**: o que cada coluna do card significa (modelo ativo, badge de prompt, consumidores, status).
- **Passo 2 — Trocar o modelo**: GIF mostrando clicar na task → aba Model → Set Active.
- **Passo 3 — Editar o prompt**: aba Prompt → escrever v2 → Salvar → Ativar (com explicação do destaque de comandos otimizados por modelo).
- **Passo 4 — Testar antes de ativar**: aba Test → side-by-side A/B com latência, custo e tokens.
- **Passo 5 — Ver histórico**: aba History (últimos 20 runs, erros destacados).
- **FAQ**: "Mudei o modelo e não vi efeito" → conferir badge "Conectado"; cache de 30s; etc.
- **Glossário**: `reasoning_effort`, `context_caching`, `prompt_version`, `task_id`.

Bilíngue PT/EN com `t()`. Bump `I18N_VERSION`.

## Fase 4 — Healthcheck automático

- Edge function `ai-task-healthcheck` (cron diário): para cada task ativa, roda input mínimo no modelo ativo. Se 4xx/5xx, marca `ai_task_status.last_error` e o painel mostra badge vermelho **"Falhando"**.
- Tabela `ai_task_status (task_id, last_run_at, last_latency_ms, last_error, ok)`.
- Card no topo do painel: "X de Y tarefas saudáveis".

## Validação por fase (obrigatória antes de avançar)

| Fase  | Smoke test                                                                                  |
|-------|---------------------------------------------------------------------------------------------|
| 2.5   | Para cada uma das ~25 funções: invoke real via `supabase--curl_edge_functions`, conferir log em `ai_task_invocations` e que o modelo usado bate com o ativo no painel. Trocar o modelo no painel, re-invocar, conferir que mudou. |
| 3     | Abrir a aba Tutorial em PT e EN; conferir que cada passo aponta para um elemento que existe.|
| 4     | Rodar healthcheck manual; forçar erro (modelo inválido em 1 task) e ver badge vermelho.     |

## Detalhes técnicos

### Tabelas novas

```sql
create table public.ai_task_invocations (
  id uuid primary key default gen_random_uuid(),
  task_id text not null,
  model_id text not null,
  prompt_version_id uuid references public.ai_prompt_versions(id),
  caller_function text,
  latency_ms int,
  tokens_in int,
  tokens_out int,
  cost_estimate numeric,
  ok boolean not null default true,
  error text,
  created_at timestamptz default now()
);

create table public.ai_task_status (
  task_id text primary key,
  last_run_at timestamptz,
  last_latency_ms int,
  last_error text,
  ok boolean default true,
  updated_at timestamptz default now()
);
```

RLS: admin-only read; service role write.

### Não-quebra (garantia)

Toda edge function migrada mantém o `try/catch` antigo como fallback. Se `resolveTask` retornar `null`, usa o hardcoded de hoje. Zero regressão garantida.

## Esforço estimado

| Fase | Tempo  | Risco                       |
|------|--------|-----------------------------|
| 2.5  | médio (~25 funções, trabalho mecânico) | baixo (fallback preservado) |
| 3    | pequeno (UI estática + i18n)           | nenhum                      |
| 4    | pequeno (1 cron + 1 tabela + badges)   | baixo                       |

## É muito difícil?

Não. É **trabalho repetitivo, não conceitual** — o padrão já está definido (router + ai_prompt_versions + ai_configurations já existem). Cada função migrada são ~15 linhas alteradas mais um smoke test. O risco real é tempo, não complexidade. Por isso a estratégia de fallback: mesmo se algo for esquecido, o sistema continua funcionando com o comportamento antigo.

## Comunicação ao usuário

Ao final de cada fase: changelog + screenshot do estado novo + lista do que foi conectado vs legacy restante. Nada vai pra demo sem smoke test passando.
