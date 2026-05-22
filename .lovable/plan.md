## Objetivo

Transformar os cards de meta-estudos arquiteturais (FundamentosTab) em "vitrines Stanford-grade" sem inventar triplets clínicos. Foco: ilustração consistente, prova de impacto arquitetural, e chat contextual.

## O que vamos construir

### 1. Ilustração consistente por paper (1x no ingest)

- Nova coluna `meta_studies.cover_image_url` (text, nullable).
- Edge function `generate-meta-study-cover`:
  - Recebe `meta_study_id`.
  - Monta prompt com **style guide fixo** (ex: "isometric scientific illustration, muted academic palette #1a2942/#c9a84c/#f5f0e8, abstract geometric shapes representing graphs/retrieval/agents, no text, no people, flat vector style, white background").
  - Concatena com tema derivado do `kind` + `title` (ex: "graph-based retrieval system" para MedGraphRAG).
  - Chama `google/gemini-2.5-flash-image` via AI Gateway.
  - Faz upload para bucket `meta-study-covers` (público) e salva URL.
- Disparo: automático no `ingest-meta-study` (após salvar), e botão "Gerar capas faltantes" no admin para backfill (3 papers atuais).
- Custo: ~$0.04/paper, 1x. Total backfill: ~$0.12.

### 2. Badge "Apoia N Core Rules" (zero IA)

- Query existente em `architectural_evidence` agrupada por `meta_study_id` + `relation` (`supports`/`contradicts`/`modulates_weight`).
- No card: badge clicável `"✓ Apoia 3 regras · ⚠ Modula 1"`.
- Click abre popover lateral listando as Core Rules afetadas com a citação textual (`quote` + `weight`).
- Já temos os dados; só falta UI.

### 3. Chat contextual por paper

- Edge function `chat-meta-study`:
  - Input: `meta_study_id`, `messages`.
  - Carrega `meta_study` (summary, key_claims, architectural_evidence) como contexto de sistema.
  - Streaming via `google/gemini-3-flash-preview`.
  - Sem RAG novo — contexto é o próprio registro (já curado).
- UI: botão `"Conversar sobre este paper"` no card → abre `Dialog` com chat. Botão secundário `"Abrir paper original"` (link `source_url` existente).

### 4. Visual do card (presentation polish)

Reorganizar `FundamentosTab` card para layout horizontal:

```text
┌─────────────────────────────────────────────────┐
│ [cover 120x120]  TÍTULO                  ★4.4   │
│                  authors · year · venue          │
│                  ───────────────────             │
│                  "1-line summary…"               │
│                  [✓ 3 regras] [📄 paper] [💬]   │
└─────────────────────────────────────────────────┘
```

- Cover à esquerda (fallback: gradient + ícone Lucide por `kind` enquanto não gerada).
- Rating estelar canto sup. direito.
- Footer com 3 ações: badge core-rules · link paper · chat.
- Expansão (click no card) mostra `key_claims` com quote highlight.

## Mudanças no banco

- `meta_studies.cover_image_url TEXT` (nullable).
- Bucket storage `meta-study-covers` (público, read-only para anon).

## Mudanças no código

- **DB**: 1 migration (coluna + bucket + policies).
- **Edge functions** (2 novas):
  - `generate-meta-study-cover/index.ts`
  - `chat-meta-study/index.ts`
- **Edge function alterada**: `ingest-meta-study` (disparar cover async via `EdgeRuntime.waitUntil`).
- **Frontend**:
  - `FundamentosTab.tsx`: novo layout de card.
  - `MetaStudyCard.tsx` (extrair em componente próprio).
  - `MetaStudyChat.tsx` (dialog + streaming).
  - `CoreRulesBadge.tsx` (popover).
  - Botão "Backfill covers" em `IngestaoMetaEstudo.tsx`.
- **i18n**: incrementar `I18N_VERSION`, adicionar chaves `fundamentos.card.*` em PT/EN.

## Não-objetivos (deixar fora)

- Triplets clínicos para papers arquiteturais (poluiria KG — conforme discussão anterior).
- Promover lessons → entities (Phase B, refactor estrutural).
- RAG vetorial novo (o contexto cabe no system prompt).

## Documentação

- `CHANGELOG.md` → entrada em `[Unreleased]` com `area: fundamentos · status: feature · i18n: yes`.
- `npm run sync:changelog` após.
- Sem mudança em sidebar/admin-tabs → organograma não muda.

## Estimativa

- Migration + bucket: 5 min
- 2 edge functions: 30 min
- Card redesign + 3 componentes: 45 min
- Backfill 3 covers: 1 min (1 clique)
- i18n + changelog: 10 min

Total: ~90 min para demo-ready.
