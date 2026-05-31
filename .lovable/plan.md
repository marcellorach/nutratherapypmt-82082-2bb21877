
# Auto-aprimoramento do gerador de auditorias + bilíngue PT/EN

Objetivo: tornar o `generate-audit` (1) capaz de capturar automaticamente novas funcionalidades sem editar o edge function, e (2) gerar o relatório em PT e EN nativos lado a lado, com a mesma estrutura visual do V7.

---

## Parte 1 — Auto-discovery de cobertura

Hoje a checklist `COVERAGE` está hardcoded em `supabase/functions/generate-audit/index.ts` (linhas 27–68). Cada nova tab, sidebar group ou área obriga edição manual.

Vamos substituir por um **derivador automático** rodado no início de cada `start`:

1. **Nova edge function `audit-scope-builder`** que, a cada chamada, lê:
   - `src/config/admin-tabs.ts` (estrutura completa de tabs)
   - `src/data/projectOrganograma.ts` (pillars, áreas, status)
   - Últimas N entradas de `CHANGELOG.md` (via `src/data/projectChangelog.generated.ts`)
   - Tabelas-chave do banco (catálogo de edge functions inferido de `supabase/functions/*` + lista de tabelas via `information_schema`)
   - Resultado: produz um array `CoverageItem[]` dinâmico + um `delta_since_last_audit` (o que mudou desde a última `technical_audits`).

2. **`generate-audit` consome esse builder** em vez do `COVERAGE` hardcoded. O `COVERAGE` antigo vira *seed/fallback* caso o builder falhe.

3. **Detecção forçada de tabs novas**: se uma tab existe em `admin-tabs.ts` mas não aparece em nenhum item do scope, o builder gera um item `[pillar: "Não classificado"]` para forçar o modelo a cobri-la. Isso garante que nenhuma nova funcionalidade fique invisível.

## Parte 2 — Meta-prompt versionado (DB-driven)

1. **Nova tabela `audit_prompt_versions`** (migration):
   ```
   id (uuid pk), version (text, ex: "v7.1"), kind (text: "system"|"per_block"|"close"),
   language (text: "pt"|"en"), prompt (text), notes (text),
   gaps_detected (jsonb), created_at, created_by, is_active (bool)
   ```
   - Grants: `authenticated SELECT`, `service_role ALL`. RLS: admins escrevem, todos autenticados leem.
   - Unique constraint: `(kind, language, is_active=true)` parcial.

2. **`generate-audit` puxa os prompts ativos do DB** em vez de hardcoded. Fallback hardcoded permanece como `v7.0` baseline para resiliência.

3. **Auto-registro de gaps**: ao final de cada geração, um passo "meta" pede ao modelo para listar (a) áreas que pediu mas não recebeu dados suficientes, (b) sugestões de melhoria no próximo prompt. Salva em `audit_prompt_versions.gaps_detected` da versão usada.

4. **UI mínima na tab `technical-audits`**: card "Versão de prompt em uso" + botão "Promover melhorias detectadas para nova versão" (admin clona a versão ativa e edita os gaps). Sem complexidade de editor avançado nesta fase.

## Parte 3 — Geração bilíngue PT + EN nativos em paralelo

1. **Schema**: adicionar coluna `language` (text, default `'pt'`) em `technical_audits` + `html_path_en text` + `pdf_path_en text` opcional. Alternativa mais limpa: criar **duas linhas** em `technical_audits` (uma `language='pt'`, outra `language='en'`) ligadas por nova coluna `language_group_id uuid`. **Vamos usar essa abordagem** — mantém o modelo de "1 row = 1 relatório" e permite navegar nos dois separadamente.

2. **`generate-audit` action `start`**:
   - Cria as **duas rows** (PT e EN) com o mesmo `language_group_id`.
   - Dispara processamento dos dois em paralelo (`Promise.allSettled`) — cada idioma faz suas próprias chamadas LLM com o prompt do `audit_prompt_versions` correspondente.
   - Cada idioma escreve seu HTML em `audit-reports/<version>/<id>-<lang>.html`.

3. **Custo/tempo**: dobra (2x chamadas LLM por bloco). Para mitigar: blocos rodam em paralelo por idioma, e o timeout de 180s já está adequado.

4. **UI da listagem em `technical-audits`**: cada relatório aparece com **dois botões** (PT/EN). Selector de idioma no topo do HTML renderizado também (link cruzado entre os dois HTMLs do mesmo `language_group_id`).

5. **Glossário consistente**: ambos prompts incluem um mini-glossário PT↔EN dos termos do projeto (Knowledge Graph, Curadoria, Digital Twin, etc.) extraído de `src/utils/translationDictionary.ts` para garantir terminologia uniforme.

---

## Detalhes técnicos

**Arquivos a criar:**
- `supabase/migrations/<ts>_audit_prompt_versions_and_bilingual.sql` — tabela `audit_prompt_versions` + colunas `language`, `language_group_id` em `technical_audits` + GRANTs + RLS + seed da v7.0 PT existente.
- `supabase/functions/audit-scope-builder/index.ts` — nova edge function (verify_jwt = false, chamada internamente).

**Arquivos a editar:**
- `supabase/functions/generate-audit/index.ts`:
  - Remover `COVERAGE` hardcoded → consumir do `audit-scope-builder` (com fallback).
  - Carregar prompts ativos por `(kind, language)` de `audit_prompt_versions`.
  - Loop principal duplicado: `for (const lang of ['pt','en']) Promise.all(...)`.
  - Após `cierre`, gravar `gaps_detected` no DB.
- `src/data/audit-coverage.ts` — manter como seed/snapshot fallback, mas marcar deprecated em comentário.
- `src/components/administrador/technical-audits/` — adicionar selector PT/EN nos cards de relatório e link cruzado.
- `CHANGELOG.md` + `src/i18n.ts` (incrementar `I18N_VERSION`) + `src/locales/{pt,en}/translation.json` (novas chaves `technicalAudits.languageBadge.*`, `technicalAudits.promptVersion.*`).

**Sequência de implementação:**

```text
1. Migration: audit_prompt_versions + language_group_id + GRANTs/RLS
2. Edge function: audit-scope-builder (auto-discovery)
3. Refactor generate-audit:
   3a. Consumir scope-builder
   3b. Consumir prompts do DB (fallback hardcoded)
   3c. Loop bilíngue paralelo
   3d. Gravar gaps_detected
4. UI: selector PT/EN + card "Versão de prompt em uso"
5. Seed inicial: v7.0 PT (atual) + v7.0 EN (tradução do prompt)
6. CHANGELOG + I18N_VERSION + sync:changelog
```

**Riscos / mitigações:**
- **Custo 2x**: aceito, pois usuário escolheu PT+EN nativos. Pode-se desativar EN via flag se necessário.
- **Prompt em EN pode divergir do PT**: glossário compartilhado + mesma estrutura de outline (gerada uma vez e reutilizada).
- **Auto-discovery pode pegar tabs irrelevantes**: builder filtra por `admin-tabs.ts` apenas (não inclui rotas públicas).
- **Backward compat**: relatórios V7 existentes (`language` NULL) continuam acessíveis; migration aplica `default 'pt'` apenas em novos rows.

**Fora de escopo nesta rodada:**
- Editor visual avançado de prompts (apenas botão "promover" + edição via DB).
- Adicionar Claude ou outros providers (opção C anterior — fica para próxima).
- Traduzir relatórios V7 antigos retroativamente.
