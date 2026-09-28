# Contrato A — "Placeholder nunca vira dado" (Stage 1)

## 1. Diagnóstico (verificado nesta sessão, só leitura)

**(a) Por que o Stage 1 recebe ~900 tokens — o texto do artigo nunca é enviado.**
- `extract-study-entities/index.ts:184` lê o prompt de usuário do banco (`ai_configurations.prompt_extraction_stage1_user`).
- `index.ts:202` faz `prompts.stage1User.replace('{{TEXT_CONTENT}}', textContent)`.
- Consulta ao banco: esse prompt tem 1.306 caracteres e **não contém `{{TEXT_CONTENT}}`** (`position = 0`). O `replace` não faz nada. O modelo recebe só instruções (prompt de sistema 1.808 + usuário 1.306 caracteres ≈ 918 tokens) e nenhum trecho do estudo.
- Stages 2 e 3 (`index.ts:226`, `:260`) usam prompts que têm o marcador, por isso recebem ~20 mil tokens.

**(b) Origem de cada valor inventado.**
- **"Astaxanthin" e "Osteoarthritis"**: são o exemplo de formato dentro do próprio prompt de usuário do Stage 1 no banco (`"nutraceuticals":[{"name":"Astaxanthin",...}]`, `"conditions":[{"name":"Osteoarthritis",...}]`, e "health_status: affected with osteoarthritis"). Sem o documento, o modelo devolveu o exemplo.
- **"0.5 mg/kg" com `source: "stage1_fallback"`**: `index.ts:422-482`. Quando o Stage 3 não valida doses (o composto do Stage 3 não bate com o Stage 1 — "Ursolic Acid" x "Astaxanthin", filtro em `:407-418`), o código transforma o campo `dosage` do Stage 1 em dose (`:458-467`). O texto "0.5 mg/kg body weight daily" veio do modelo do Stage 1, que não tinha o artigo. Não consigo provar de onde ele tirou esse número; não aparece literalmente no prompt.
- **`confidence: 0.7` em extractedConditions**: `index.ts:806-809` (`treatability_score ?? 3`).
- **Tripla Astaxanthin → TREATS → Osteoarthritis (0.16)**: `index.ts:726-742` cruza todo nutracêutico do Stage 1 com toda condição do Stage 1. `efficacy_score 0.8 / 5 = 0.16`, que bate com o valor gravado.
- **Outros atalhos no mesmo caminho**: `index.ts:838-868` inventa listas de nutracêuticos/condições a partir das triplas quando o Stage 1 vem vazio; `index.ts:212-214` engole erro do Stage 1 e segue como se fosse vazio.
- **`condition_efficacy_shim`**: gravado por `gemini-file-search/index.ts:2489-2494` em `study_extractions.extracted_data` (cópia das condições da leitura do PDF). Não é inventado, mas é duplicata; o contrato pede remoção.

## 2. Remover atalhos e valores de exemplo (código)

- `index.ts:202-204`: se o prompt não contém `{{TEXT_CONTENT}}`, anexar o documento ao final do prompt (em vez de mandar sem texto). Se mesmo assim o texto estiver vazio, não chamar o modelo.
- `index.ts:212-215`: erro vira `stage1 = {status:"failed", reason}`; resultado sem entidades vira `stage1 = {status:"empty", reason}`. Gravado em `ingestion_stages.extract_entities.stage1`.
- Guarda determinística: entidade do Stage 1 cujo nome normalizado não aparece no texto do artigo é descartada e listada em `stage1.dropped_not_in_text`.
- Apagar `index.ts:422-482` (fallback de doses) e `index.ts:838-868` (listas derivadas de triplas).
- `index.ts:806-809`: sem valor padrão de confiança (`null` quando o modelo não informar).
- Tripla nutracêutico × condição (`:726-742`) só é criada se ambos sobreviveram à guarda.
- Prompts padrão no código (`getDefaultStage1UserPrompt`, `:1354`): remover qualquer dado de exemplo. Sem outra mudança de redação.
- `gemini-file-search/index.ts:2489`: deixar de gravar `condition_efficacy_shim` (a informação já existe em `conditions`).

## 3. Verificador de consistência (sem IA)

- Novo módulo puro `supabase/functions/_shared/writerConsistency.ts` (espelhado para o front, no padrão de `useStudyRichData.pure.ts`).
- Compara, por nome normalizado (minúsculas, sem acento/pontuação, sinônimos PT/EN do `clinical-name-canonicalizer`), a leitura do PDF (`analysis_data.conditions`, `analysis_data.nutraceuticals`) com o Stage 1 (condições e nutracêuticos que o Stage 1 devolveu, guardados em `stage1.conditions` / `stage1.nutraceuticals`, porque `extractedNutraceuticals` pertence à leitura do PDF e o merge não deixa o Stage 1 sobrescrevê-lo).
- Conjuntos disjuntos (e ambos não vazios): `consistency = {status:"conflict", pdf:[...], stage1:[...]}`. Caso contrário, `{status:"ok"}` ou `{status:"insufficient"}`.
- Chamado ao fim do Stage 1, gravado em `ingestion_stages.extract_entities.consistency`.

## 4. Tela

- `NtaiConditionsTab.tsx` passa a receber as duas listas e mostra a origem de cada condição (selo "Leitura do PDF" ou "Stage 1"). Com conflito, alerta no topo e lista do PDF primeiro. Nada é apagado.
- `NtaiAnalysisResults.tsx:83-97`: contagem e props da aba.
- Alerta no card do estudo: ler `consistency.status`. O arquivo exato do card será confirmado na execução (candidatos: `NtaiProcessCard.tsx`, card do kanban de curadoria).
- i18n PT/EN (`studies.ntai.conditions.origin.*`, `...consistency.*`), bump de `I18N_VERSION` para 1.136.0.

## 5. Auditoria do acervo (já executada, só leitura)

**Marcadores `stage1_fallback` / `condition_efficacy_shim`:** apenas 1 estudo.

| Estudo | stage1_fallback em analysis_data | em extracted_data | shim em extracted_data |
|---|---|---|---|
| e3b79d33 (Ursolic Acid) | sim | sim | sim |

**Triplas Astaxanthin → Osteoarthritis (5 em 3 estudos):**

| Estudo | Título | Status | Auto | Conf. | Criada |
|---|---|---|---|---|---|
| cceb7612 | Vitamins, Minerals and Phytonutrients as Modulator… | approved | sim | 0.80 | 11/03/2026 |
| cceb7612 | idem | approved | sim | 0.60 | 11/03/2026 |
| deb7565a | Roles of plant-based ingredients and phytonutrient… | pending | não | 0.80 | 13/05/2026 |
| deb7565a | idem | pending | não | 0.80 | 13/05/2026 |
| e3b79d33 | Ursolic Acid… | rejected | não | 0.16 | 23/09/2026 |

Os dois outros estudos são revisões sobre fitonutrientes, onde a relação pode ser legítima; não verifiquei os textos. Fica para Marcello decidir se entram em curadoria. Nada será alterado.

## 6. Nova rodada do Stage 1 para e3b79d33 (após 2–4 testados)

- Novo modo `{ studyId, stage1Only: true }` na função: roda só o Stage 1 (1 chamada de IA), sem Stages 2/3, sem triplas, sem `force_reextract`.
- Escreve apenas: `analysis_data.extractedConditions`, remove de `analysis_data.dosages` as entradas `source:"stage1_fallback"`, remove `condition_efficacy_shim` de `extracted_data`, grava `stage1` e `consistency` em `ingestion_stages`. Os valores removidos ficam copiados em `ingestion_stages.extract_entities.stage1.removed_previous` (backup dentro das tabelas permitidas).
- Relatório antes/depois com consulta SQL real.

Estado atual (antes): `extractedConditions = [{Osteoarthritis, 0.7}]`; `dosages` = 2 de Ursolic Acid (24 mg, 120 mg) + 1 Astaxanthin 0.5 mg/kg `stage1_fallback`.

## Testes

- vitest `writerConsistency.test.ts`: disjunto → conflict; sobreposição parcial → ok; sinônimo PT/EN → ok; uma lista vazia → insufficient; caso real do e3b79d33.
- vitest para a guarda "nome precisa estar no texto" e para o anexo do documento quando o prompt não tem marcador.
- Suíte atual precisa seguir verde; typecheck limpo.
- CHANGELOG + `npm run sync:changelog`.

## Conflitos com o contrato (decisão de Marcello)

1. **A causa raiz está num dado do banco fora das tabelas permitidas.** O prompt do Stage 1 salvo em `ai_configurations` não tem o marcador e contém o exemplo Astaxanthin/Osteoarthritis. O critério (v) proíbe alterar essa tabela, então o plano corrige **só no código** (anexar o documento; descartar o que não está no texto). O exemplo continua no prompt salvo. Recomendo um contrato B curto para limpar esse prompt.
2. **Isso afeta todos os estudos futuros.** Desde que esse prompt foi salvo, todo Stage 1 roda sem o artigo. Com a correção, os próximos estudos mudam de comportamento (Stage 1 passa a receber ~20 mil tokens: mais custo e mais tempo por estudo).
3. Remover a gravação do shim em `gemini-file-search` exige novo deploy dessa função. Nenhum estudo é reprocessado por isso.

## Argumento contra o próprio plano

- O Stage 1 é quase redundante: a leitura do PDF já extrai condições e nutracêuticos melhores. Manter o Stage 1 com texto completo dobra o custo de tokens para gerar uma lista que perde para a do PDF. A alternativa mais simples seria **aposentar o Stage 1** e usar as listas do PDF como entrada dos Stages 2/3. Não faço isso aqui porque mexe em mais coisa do que o contrato permite.
- A guarda "nome precisa estar no texto" pode descartar entidades verdadeiras escritas de outro jeito (ex.: "UA" para ácido ursólico). Mitigação: registrar o descartado, nunca apagar em silêncio.
- O verificador por nome só pega conflito total. Sobreposição parcial com lixo (uma condição certa + uma inventada) passa como "ok".

## Detalhes técnicos

- Arquivos: `supabase/functions/extract-study-entities/index.ts` (linhas citadas), `supabase/functions/gemini-file-search/index.ts:2489`, novo `_shared/writerConsistency.ts`, `src/components/administrador/estudos/analysis/results/NtaiConditionsTab.tsx`, `NtaiAnalysisResults.tsx`, card do estudo, `src/i18n.ts`, locales PT/EN, `CHANGELOG.md`.
- Deploy de `extract-study-entities` e `gemini-file-search`. Sem migração. Sem publicar.
- Única chamada de IA: item 6, um estudo.
