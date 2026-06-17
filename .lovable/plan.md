## Escopo aprovado: A + B + C + D + Verificação de integridade na UI

### Frente A — Seed das 21 chaves faltantes no DB
Migration `INSERT … ON CONFLICT (prompt_key) DO NOTHING` para popular as 21 linhas ausentes em `ai_system_prompts`, copiando do manifest: `default_content + purpose + model_default + temperature + output_format + consumers + tags + example_input`. Resultado: DB passa de 24 → 45 linhas alinhadas com o manifest.

### Frente B — `sync-system-prompts` idempotente (upsert)
Trocar o `UPDATE` da edge function por `upsert` (`onConflict: 'prompt_key'`). Status novo: `inserted | updated | unchanged | error`. Qualquer chave futura adicionada ao manifest passa a entrar no DB com um clique em "Sincronizar com o código".

### Frente C — Migrar prompts hardcoded para o catálogo
Para cada função abaixo, adicionar chave no manifest com metadata completa e substituir o literal por `await getSystemPrompt(supabase, '<key>', fallback)`:

1. `chat` → `chat_assistant_streaming` (separado de `chat_assistant` se o prompt for distinto)
2. `generate-triplets` → `generate_triplets_extraction` (núcleo da extração)
3. `process-study` → `process_study_pipeline`
4. `extract-meta-study` → `extract_meta_study`
5. `generate-meta-study-cover` → `generate_meta_study_cover`
6. `generate-showcase` → `generate_showcase`
7. `classify-entity` → `classify_entity`
8. `calculate-recommendation-confidence` → `calculate_recommendation_confidence`
9. `finalize-stalled-cohort` → `finalize_stalled_cohort`
10. `enrichment-qa-sample` → `enrichment_qa_sample`
11. `compare-snapshots` → `compare_snapshots`
12. `fetch-external-ontologies` → `fetch_external_ontologies`

Resultado: ~12 chaves novas no manifest e no DB; catálogo final ≈ 57 chaves.

### Frente D — Preencher metadata das 24 chaves antigas
Passar pelas chaves originais do manifest e adicionar `purpose / model_default / temperature / output_format / consumers / tags` onde só existe `content`. Painel admin e PDF de catálogo ficam completos.

---

### Frente E (NOVA) — Verificação contínua e selo na página de prompts

**Tabela nova `ai_system_prompts_integrity_check`** (admin-only) com colunas:
- `app_version` (texto, ex: "1.4.2" lido de `package.json`/constante)
- `manifest_count`, `db_count`, `missing_in_db` (array), `extra_in_db` (array), `hardcoded_outside_catalog` (array)
- `out_of_sync` (array de keys onde `default_content` do DB ≠ manifest)
- `status` (`ok` | `drift`)
- `checked_at` (timestamp), `triggered_by` (`auto_on_version_bump` | `manual`)

**Edge function nova `verify-system-prompts`**: compara manifest × DB × lista de funções com prompts hardcoded e grava 1 linha. Retorna o relatório.

**Disparo automático**: na inicialização do app (front), se `localStorage.lastVerifiedAppVersion !== APP_VERSION`, chama a edge function uma vez e salva no localStorage. Isso garante uma verificação a cada subida de versão sem custo recorrente.

**UI no painel `/administrador?tab=prompts`** (header do `SystemPromptsCatalog.tsx`): badge fixo com:
- `Versão do sistema: vX.Y.Z`
- `Última verificação: DD/MM/AAAA HH:mm`
- `Status: ✅ Sincronizado` (verde) ou `⚠️ Drift detectado (N divergências)` (âmbar) com expand mostrando o detalhe
- Botão "Verificar agora" que reexecuta `verify-system-prompts` on-demand

Tudo bilíngue (PT/EN) via `t()` e `I18N_VERSION` incrementado.

---

### Ordem de execução
1. Migration da Frente A (seed) + tabela da Frente E.
2. Edge function `verify-system-prompts` (Frente E) + atualização do `sync-system-prompts` para upsert (Frente B).
3. Frente D — completar metadata das 24 antigas no manifest.
4. Frente C — migrar 12 funções hardcoded uma a uma (commits separados por função para reduzir risco).
5. Frente A novamente (rodar `sync-system-prompts` para inserir as 12 novas chaves da Frente C no DB) + UI da Frente E + i18n.
6. Documentação: `ARCHITECTURE.md` + `CURRENT_STATE.md` + `CHANGELOG.md`.

### Não-objetivos (intencional)
- Não tocar em prompts de testes utilitários (`ai-task-test`, `test-rag-similarity`).
- Não migrar prompts já vivendo em arquivos compartilhados se já forem importados por múltiplas funções (verificar caso a caso).
- Não alterar `override_content` existente em nenhuma linha do DB.

Se aprovado, implemento na ordem acima.