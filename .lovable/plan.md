## Decisão de política

**Toda auditoria a partir de agora é standalone e cumulativa.** Cada versão é um documento auto-suficiente (~30+ páginas, paridade total com a base v3/v5.1.0) que herda o que continua válido, atualiza métricas vivas, marca explicitamente o delta no topo e remove conteúdo obsoleto. Isso alinha com FDA SaMD, ISO 13485 e GMLP — qualquer revisor externo lê uma única versão e entende o sistema inteiro.

## Etapa 1 — Regenerar v5.2.0 como auditoria completa

Reescrever `public/audits/v5.2.0/{index.html,auditoria.pdf,auditoria.docx}` com a mesma estrutura de 29 seções da v5.1.0, agora cobrindo o estado em 31/05/2026:

- Carregar a base textual da v5.1.0 (sumário, glossário, metodologia, 5 camadas, pipeline 7 estágios, RLS, LLM por edge function, KG, 6 estágios do paciente, recomendação híbrida, Digital Twin, 4 jornadas, matriz FDA/EMA/AVMA/GMLP, 4 apêndices, bibliografia).
- Atualizar contagens vivas do banco (triplets, edges, conditions, edge functions, i18n_version 1.115.6).
- Adicionar **Seção 1.1 — Mudanças desde a v5.1.0**: as 5 alterações do período (AI Scientist, validação vet-curador de cohort_insights, evidência quantitativa obrigatória, canonicalização PT/EN + lab-flag-canonicalizer, hardening de suggest-cohort-ideas) com impacto sobre gaps/riscos.
- Atualizar matriz regulatória: FDA 5→6/7, EMA 3→4/4, GMLP 7→8/10.
- Reduzir contagem de gaps (12→9) e riscos (5→4) com justificativa de cada mitigação.
- Reaproveitar os 10 infográficos PNG (já em `media/`).
- Meta: ≥30 páginas, ≥6.500 palavras, 10 infográficos, 14 referências, mesmo CSS.

Atualizar `summary` da v5.2.0 no DB: remover flag `type: "delta"` e `base_audit`, ajustar `pages`, `words`, `sections` para refletir documento completo.

## Etapa 2 — Descontinuar v5.1.0

- Adicionar coluna `superseded_by` na tabela `technical_audits` (text, nullable, FK lógica para outra `id`).
- Marcar `v5.1.0.superseded_by = 'v5.2.0'`.
- Filtrar v5.1.0 da lista principal em `TechnicalAuditsTab.tsx` (e do card de comparação) — versão continua acessível via toggle "Mostrar versões descontinuadas" no fim da lista, com badge cinza "Substituída por v5.2.0" e link para a sucessora.
- Card de comparação passa a comparar **v3 ↔ v5.2.0** (2 versões) até existir uma terceira ativa.

## Etapa 3 — Trigger duplo de novas auditorias

**3a. Manual (mantém):** botão "Solicitar v{próxima}" existente continua funcionando.

**3b. Automático por N mudanças relevantes no CHANGELOG:**
- Novo edge function `audit-change-watchdog` (chamada via cron diário ou no `sync:changelog`):
  - Conta entradas `Added`/`Changed`/`Fixed` no `CHANGELOG.md` em áreas críticas (`curation`, `kg`, `clinical-pipeline`, `infra`, `base-knowledge`) desde o `system_changelog_date` da última auditoria ativa.
  - Se contagem ≥ **6** (configurável via `audit_settings.change_threshold`), insere automaticamente uma `audit_requests` com status `pending`, scope auto-gerado listando as mudanças detectadas, e flag `auto_triggered = true`.
- Nova migration:
  - `audit_settings` (single-row config: `change_threshold INTEGER DEFAULT 6`, `watched_areas TEXT[]`).
  - `audit_requests.auto_triggered BOOLEAN DEFAULT false`.
  - `technical_audits.superseded_by TEXT`.
- UI: badge "🤖 auto" em requests auto-disparadas; slider de threshold em uma nova mini-seção "Configuração de auditoria" abaixo do card de comparação.

**Importante:** o threshold dispara apenas a **sugestão** (requisição pendente). A auditoria em si continua sendo gerada manualmente por mim ou por você via botão.

## Etapa 4 — Atualizar memória do projeto

Criar `mem://workflow/audit-standalone-policy` registrando:
- Toda auditoria é standalone + cumulativa.
- Trigger: manual ou ≥6 mudanças em áreas críticas desde a última.
- Versão anterior fica como `superseded_by` (não apagada).

## Detalhes técnicos

- **Geração**: mesmo pipeline da v5.1.0 (markdown → pandoc → HTML/DOCX, chromium headless → PDF). Reaproveita `style.css` e `media/`.
- **DB changes**: 1 migration (3 alterações de schema), 1 UPDATE em `technical_audits`.
- **Frontend**: pequena refatoração em `TechnicalAuditsTab.tsx` para filtrar superseded + toggle; ajuste no `AuditVersionComparison.tsx` para ignorar superseded por padrão.
- **Edge function**: nova função `audit-change-watchdog` lendo `CHANGELOG.md` via fetch do raw GitHub (ou do arquivo público servido pelo Vite).

## O que NÃO muda

- Estrutura visual do tab (mesmo layout 360px + viewer).
- Card de comparação que acabei de criar — ele já está pronto para 2 ou 3 versões.
- Política existente de `Curation Gatekeeper`, `No-Mock`, `Bilingual System`.

## Tempo estimado

- Etapa 1 (regenerar v5.2.0 completa): ~6 min
- Etapa 2 (superseded + UI): ~2 min
- Etapa 3 (watchdog + migration + UI config): ~5 min
- Etapa 4 (memória): ~1 min

Total: ~14 min de execução autônoma.

## Confirme

Posso seguir com as 4 etapas em sequência? Único parâmetro que vale validar: **threshold default = 6 mudanças** em áreas críticas. Aceita ou prefere outro número (4? 8?)?
