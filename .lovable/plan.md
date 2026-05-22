## Objetivo
Tornar a confiabilidade auditável direto no card do Kanban (sem precisar abrir o diálogo) e permitir ajustar as 5 dimensões com **preview em tempo real do `reliability_overall`** + métricas auxiliares (tripletes derivados do estudo, propostas, idade).

## Onde mexer
Arquivo único: `src/components/administrador/fundamentos/MetaStudyKanban.tsx`
(+ chaves i18n em `src/locales/{pt,en}/translation.json` e bump de `I18N_VERSION` em `src/i18n.ts`)

Nenhuma mudança de schema. `reliability_overall` continua como coluna gerada no Postgres (média das dimensões preenchidas) — o preview no card replica essa mesma fórmula em JS para feedback imediato.

## Mudanças no card

1. **Header compacto sempre visível**
   - Título + ano + kind (como hoje)
   - Badge `★ overall/5` com cor por faixa (já existe)
   - **Novos chips de métrica:** `n tripletes`, `n propostas`, idade do estudo (`há Xd`)

2. **Botão "Confiabilidade" expansível no próprio card** (chevron)
   - Ao expandir, mostra as 5 dimensões em linha condensada: nome curto + valor + mini-slider (`h-1`, step 0.5)
   - Ao arrastar qualquer slider:
     - estado local atualiza
     - **`overall` recalculado na hora** (`sum / countFilled`) e badge superior pisca/anima
     - chip "não salvo" aparece
   - Dois botões: **Salvar** (persist + refetch do `reliability_overall` real do DB para confirmar) e **Descartar**
   - Stop propagation para não abrir o diálogo

3. **Breakdown visual de contribuição**
   - Mini barra horizontal mostrando contribuição de cada dimensão para a média (5 segmentos coloridos proporcionais)
   - Tooltip por segmento com nome da dimensão e valor

4. **Métricas auxiliares (read-only no card expandido)**
   - `Tripletes vinculados`: `SELECT count FROM extracted_triplets WHERE meta_study_id = ?`
   - `Propostas`: `row.proposed_rules.length` (já temos)
   - `Dimensões preenchidas`: `x/5`
   - Essas métricas **não entram no `overall`** (que segue a fórmula do DB), só dão contexto ao curador.

## Carregamento de tripletes
Após o `load()` atual, fazer uma query agregada única:
```ts
supabase.from('extracted_triplets')
  .select('meta_study_id', { count: 'exact', head: false })
```
e agrupar client-side em um `Map<studyId, count>`. Passar como prop pro card. Se a coluna não existir em todos os estudos (legado), default 0.

## Persistência
- `saveReliability` continua igual (update das 5 colunas, select do `reliability_overall` gerado)
- Após salvar, comparar o `overall` previsto local vs. o retornado do DB → se divergir, toast de aviso (defensivo)

## i18n (novas chaves PT/EN)
- `fundamentos.kanban.card.expandReliability` / `collapseReliability`
- `fundamentos.kanban.card.unsaved`
- `fundamentos.kanban.card.dimsFilled` ("{{n}}/5 dimensões")
- `fundamentos.kanban.card.triplets` ("{{n}} tripletes")
- `fundamentos.kanban.card.contributionTooltip`
- Labels curtos para sliders inline (`Metod.`, `Evid.`, `Aplic.`, `Reprod.`, `Relev.`)

Incrementar `I18N_VERSION` em `src/i18n.ts`.

## Detalhes técnicos
```text
overall = sum(filled) / count(filled)   // idêntico à coluna gerada do DB
```
- Slider local em estado `editingScores` (Record<studyId, Partial<scores>>) para não conflitar com `selected`
- Sliders param o `e.stopPropagation()` no click/drag para não abrir o diálogo
- Manter o diálogo atual (`ReliabilityEditor`) intacto como visão "full" para quem prefere

## Documentação
- `CHANGELOG.md` → `[Unreleased]` → Changed: "Kanban Meta-Estudos: breakdown de confiabilidade inline no card com preview em tempo real do reliability_overall e chips de tripletes/propostas/idade"
- Rodar `npm run sync:changelog` ao final
- Sem mudança de organograma (mesma tab, mesmo componente)
