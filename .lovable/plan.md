## Problema

A digestão atual reduz papers arquiteturais densos (ex.: MedGraphRAG) a ~4 "claims" planos e só sabe **vincular** a RCs que já existem. Lições novas (chunking, vocabulários controlados, U-Retrieval, anti-padrões) se perdem. Além disso, todas as RCs atuais nasceram de incidentes no chat (indução) — não há canal formal para regras **deduzidas de literatura**, que é justamente a razão de existir do meta-KG.

## Princípio

Toda regra-core deve declarar sua **origem epistêmica**:
- `inductive` — emergiu de incidente concreto / discussão usuário↔IA (ex.: RC-001, RC-002).
- `deductive` — destilada de paper arquitetural/metodológico no meta-KG.
- `hybrid` — incidente confirmado depois por literatura (ou vice-versa).

Isso torna auditável "por que acreditamos nisso" e habilita workflows distintos de validação.

## Mudanças propostas

### 1. Schema rico de extração (`extract-meta-study`)

Substituir `key_claims` plano por **seções tipadas**, cada uma com mínimo recomendado de itens (instrução no prompt, não constraint rígido):

```text
emit_meta_study_draft {
  title, authors, year, journal, doi, kind, summary,

  architectural_patterns[]     // padrões reutilizáveis (Triple Graph, U-Retrieval...)
  methodological_recipes[]     // como fazer X (chunking 512 tokens, ...)
  vocabularies_standards[]     // UMLS, SNOMED, MeSH adotados
  quantitative_parameters[]    // chunk_size=512, top_k=10, weight=0.7
  anti_patterns_pitfalls[]     // o que NÃO fazer + por quê
  evaluation_metrics[]         // como medir sucesso (precision@k, ...)
  open_questions[]             // lacunas reconhecidas pelos autores

  // cada item = { statement, quote (literal ≤300 chars), weight 0–1, applies_to }

  suggested_links[]            // (como hoje) vínculos a RCs existentes
  proposed_rules[]             // NOVO: candidatos a RC deduzidos do paper
}
```

`proposed_rules[]` por item: `{ proposed_title, category, enunciado, justification_quote, suggested_application, confidence }` — status sempre `proposed`, **nunca grava direto em `core_rules`**.

O prompt do sistema passa a exigir explicitamente: "extraia entre 8–20 lições no total entre as categorias acima; se uma lição não cabe em RC existente, emita em `proposed_rules`".

### 2. Coluna `origin` em `core_rules`

Migração:
```sql
alter table core_rules
  add column origin text not null default 'inductive'
    check (origin in ('inductive','deductive','hybrid')),
  add column proposed_from_meta_study uuid references meta_studies(id),
  add column promoted_at timestamptz,
  add column promoted_by uuid;
```

Backfill: RC-001, RC-002 → `inductive`; RC-003 (planejada) → `deductive` quando promovida do paper de anti-aging.

### 3. UI de revisão na Fundamentos > Ingestão

Tabs no rascunho devolvido:
- **Lições estruturadas** (7 categorias acima, com contadores)
- **Vínculos a RCs existentes** (como hoje)
- **🆕 Novas RCs propostas** — cada uma com botões `Promover para RC-NNN` / `Mesclar com RC existente` / `Descartar`. Promover gera nova linha em `core_rules` com `origin='deductive'` e `proposed_from_meta_study` apontando para o meta-study.

### 4. `docs/CORE_RULES.md` — seção nova

Adicionar bloco no topo "**Origem das regras**" explicando indutivo/dedutivo/híbrido + convenção: toda RC deve declarar origem no header. Adicionar campo `Origem:` ao template.

### 5. Pasta de "regras candidatas" (deduzidas, ainda não promovidas)

`docs/CORE_RULES_PROPOSED.md` — espelha automaticamente as `proposed_rules` ainda não revisadas, para visibilidade humana fora da UI. Sincronizado por extensão do `scripts/sync-core-rules.mjs` (Fase 2 já planejada).

## Não inclui (fora de escopo deste plano)

- Re-extrair retroativamente meta-estudos já ingeridos (faremos botão "re-digerir com schema v2" depois).
- Mudar pipeline de **estudos clínicos** (`extract-study-entities`) — este plano só toca o pipeline **arquitetural** (`extract-meta-study`).
- Auto-promoção de regras deduzidas — toda promoção continua humana (consistente com a regra de Curadoria Gatekeeper).

## Detalhes técnicos

**Arquivos a tocar:**
- `supabase/functions/extract-meta-study/index.ts` — novo `TOOL.parameters`, novo `systemPrompt`, novo `trace` por categoria.
- `supabase/migrations/<timestamp>_core_rules_origin.sql` — migração acima.
- `src/components/administrador/fundamentos/IngestaoMetaEstudo.tsx` — renderizar 7 categorias + aba "Novas RCs propostas" com ações.
- `docs/CORE_RULES.md` — seção "Origem das regras" + template atualizado.
- `docs/CORE_RULES_PROPOSED.md` — arquivo novo (placeholder).
- `CHANGELOG.md` + `npm run sync:changelog`.

**Validação após implementação:**
Re-ingerir o paper MedGraphRAG; esperar ≥10 lições distribuídas entre `architectural_patterns`, `methodological_recipes`, `vocabularies_standards`, `quantitative_parameters`, e ≥2 entradas em `proposed_rules` (ex.: "Chunking obrigatório acima de N tokens", "Vocabulário controlado UMLS-equivalente para entidades clínicas").
