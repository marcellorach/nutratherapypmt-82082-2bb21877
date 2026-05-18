## Diagnóstico

**Por que aparecem "sem conteúdo"?**
A tabela `ai_system_prompts` já tem os 24 prompts registrados (chave + família + função + descrição), mas **`default_content` está vazio em todos os 24 registros** (verificado via DB). A UI marca "sem conteúdo" sempre que `override_content` e `default_content` são ambos nulos/vazios.

Os textos reais dos prompts hoje vivem **dentro do código das edge functions** (constantes `SYSTEM_PROMPT`, `SYSTEM_PROMPT_ENRICH`, etc., em `supabase/functions/<nome>/index.ts`). Nunca houve um pipeline que copiasse esses textos para a tabela — daí o vazio.

**"Gerar Prompts de Exemplo"** existe em `PromptConfigurationTab.tsx` (aba "Prompts de Recomendação"). É um gerador de mocks que cria 3 prompts fake ("Análise de Deficiências Nutricionais", "Prevenção por Raça", "Otimização de Performance") e grava em `ai_configurations` com prefixo `prompt_`. Bagunça o catálogo real e viola o "No-Mock Policy".

---

## O que vou fazer

### 1. Manifest único de prompts no código (`supabase/functions/_shared/system-prompts.ts`)

Criar um arquivo TypeScript exportando os **24 prompts reais** num único objeto:

```ts
export const SYSTEM_PROMPTS: Record<string, { content: string; description?: string }> = {
  extract_pet_clinical_data: { content: `You are a veterinary clinical data extraction…` },
  parse_pet_exam_pdf:        { content: `…` },
  relations_auditor:         { content: `Você é o Auditor Conversacional sobre Relações…` },
  hybrid_recommendation:     { content: `You are a veterinary nutraceutical expert specializing…` },
  // …todas as 24 chaves
};
```

Conteúdo para cada chave:
- **8 chaves** (extract_pet_clinical_data, relations_auditor, hybrid_recommendation, web_dosage_lookup, extract_study_entities, gemini_file_search, kg_evidence_gap_fill, translate_conditions, translate_text): **copio o texto literal** já existente nas edge functions correspondentes.
- **16 chaves restantes** (parse_pet_exam_pdf, condition_insights, project_pet_trajectory, chat_assistant, proposal_ai_chat, enrich_pet_food_product, backfill_triplet_enrichment, enrich_triplet, enrich_knowledge_graph, kg_missing_triplets, consolidate_knowledge_graph, vectorize_study, parse_study, auto_tag_studies, suggest_taxonomy_terms): **escrevo prompts de produção curados** alinhados ao propósito declarado na coluna `description` da tabela e à função correspondente (não exemplos didáticos — prompts reais que o sistema deve usar).

### 2. Edge function `sync-system-prompts`

Lê `SYSTEM_PROMPTS` do manifest e faz `UPDATE ai_system_prompts SET default_content = $manifest WHERE prompt_key = $key` para cada chave. **Nunca toca em `override_content`** (preserva customizações do admin).

### 3. Refatorar edge functions existentes para o padrão "DB-first, manifest-fallback"

Onde já há `SYSTEM_PROMPT` hardcoded (extract-pet-clinical-data, relations-auditor, hybrid-recommendation, web-dosage-lookup), substituir por um helper compartilhado:

```ts
import { getSystemPrompt } from '../_shared/system-prompts.ts';
const systemPrompt = await getSystemPrompt(supabase, 'relations_auditor');
// retorna override_content ?? default_content ?? manifest[key].content
```

Assim **edita no admin = pega efeito imediato**; trocar texto no código + rodar sync = atualiza default sem mexer em overrides.

### 4. UI — `SystemPromptsCatalog.tsx`

Adicionar no header:
- Botão **"Sincronizar com o código"** → chama `sync-system-prompts`, mostra toast com nº de prompts atualizados, recarrega lista.
- **Auto-sync on mount**: ao montar, se detectar qualquer prompt com `default_content` vazio, chama o sync silenciosamente (resolve o estado atual sem o admin precisar clicar).
- Pequeno selo `default v{hash}` ao lado de cada card indicando data da última sincronização (`updated_at` da linha).

### 5. UI — `PromptConfigurationTab.tsx` (aba "Prompts de Recomendação")

- **Remover** o botão "Gerar Prompts de Exemplo" (header + estado vazio).
- **Remover** a função `generateRandomPrompts` inteira.
- **Remover** as chaves i18n `admin.prompts.generateExample`, `generateExamples`, `messages.generated`, `messages.generatedDescription` em PT e EN.
- Substituir o estado vazio por mensagem informativa: "Os prompts do sistema são gerenciados na aba **System Prompts**. Use 'Novo Prompt' apenas para prompts customizados de recomendação."

### 6. Bilíngue + versionamento

- Bump `I18N_VERSION` em `src/i18n.ts`.
- Atualizar PT/EN nas chaves novas (`syncWithCode`, `syncing`, `syncedToast`, `defaultMissingHint`).

### 7. Changelog + organograma

- Entrada em `CHANGELOG.md` `[Unreleased]` com `area: prompts · status: done · i18n: 1.86.6`.
- Rodar `npm run sync:changelog`.
- Atualizar `src/data/projectOrganograma.ts` mencionando o manifest compartilhado.

---

## Arquivos afetados

**Criados**
- `supabase/functions/_shared/system-prompts.ts` (manifest + helper `getSystemPrompt`)
- `supabase/functions/sync-system-prompts/index.ts`

**Editados**
- `src/components/administrador/configuracoes/SystemPromptsCatalog.tsx` (botão sync + auto-sync)
- `src/components/administrador/PromptConfigurationTab.tsx` (remover gerador)
- `supabase/functions/extract-pet-clinical-data/index.ts`
- `supabase/functions/relations-auditor/index.ts`
- `supabase/functions/hybrid-recommendation/index.ts`
- `supabase/functions/web-dosage-lookup/index.ts`
- `src/locales/{pt,en}/translation.json`
- `src/i18n.ts`
- `CHANGELOG.md` + `src/data/projectOrganograma.ts`

**Migration**
- Nenhuma estrutural. O sync usa `UPDATE` na tabela existente; populamos via edge function (não via migration) para que o admin possa re-rodar sempre que mexermos no manifest.

---

## Resultado para o usuário

1. Ao abrir a aba **System Prompts** após esta entrega: todos os 24 cards mostram o conteúdo real (auto-sync silencioso preenche os vazios).
2. Botão **"Sincronizar com o código"** sempre disponível para refazer o sync depois de qualquer alteração no manifest.
3. Aba **"Prompts de Recomendação"** sem o botão de exemplos.
4. Sempre que trocarmos um prompt no código (`SYSTEM_PROMPTS` no manifest), basta clicar Sincronizar — overrides do admin permanecem intactos.