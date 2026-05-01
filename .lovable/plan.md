
# Plano: Reestruturação da Gestão de Estudos Científicos

## Resumo do estado atual (o que já existe)

A aba **Estudos Científicos** tem hoje 4 sub-abas em sequência:

```
[Library] ⇢ [Upload] → [AI Processing] → [Curation]
```

O que cada uma realmente faz hoje:

- **Library** (mal nomeada): é na verdade a **lista bruta de `scientific_studies`** (13 registros) + o botão "Search External Studies" (PubMed + OpenAlex). Não mostra o conteúdo curado, não mostra relações.
- **Upload / AI Processing / Curation**: alimentam `processed_studies` (46) e geram `triplet_extractions` (4.094 triplas, 3.494 aprovadas que viram nós/arestas no KG).
- Após aprovação na Curation, **o estudo "desaparece" da UI** — não há lugar para o usuário voltar e ler o paper integralmente, nem ver com quais nós do KG ele se conecta, nem quais outros estudos compartilham triplas com ele.

Esse é o gap que o usuário quer resolver.

## a) Renomear "Library" → "External Search"

Mudanças mínimas:

1. `src/components/administrador/estudos/import/TabNavigation.tsx` — trocar label e ícone da primeira aba:
   - `value: "library"` → `value: "external-search"`
   - `label: t('studies.import.libraryTab', 'Library')` → `t('studies.import.externalSearchTab', 'External Search')`
   - Ícone `BookOpen` → `Search` (o `BookOpen` passa a ser usado pela nova Biblioteca pós-curadoria)
2. `SciImportSection.tsx` — atualizar o `useState("library")` default e o `<TabsContent value="library">` para `"external-search"`.
3. Ajustar chaves em `pt/translation.json` e `en/translation.json` (`studies.import.externalSearchTab`) e **incrementar `I18N_VERSION`** em `src/i18n.ts`.
4. Os componentes internos (`StudiesLibraryTab`, `SearchExternalStudies`) podem manter o nome de arquivo por enquanto — não vale o ruído de renomear arquivos sem necessidade. Vou apenas trocar o **título visível** do painel para "Busca Externa de Estudos".

## b) APIs de pesquisa científica com IA

**SciSpace (typeset.io) NÃO oferece API pública** — confirmei em `scispace.com/api` (404), `typeset.io/resources/api` (404) e na navegação do site (só Pricing/Premium voltado a usuário final). É um produto SaaS sem programa de developers exposto. Mesmo no plano Premium, o acesso é via UI/Chrome extension.

Alternativas reais com API documentada (em ordem de adequação ao nosso caso, que é veterinária/longevidade canina):

| Provedor | Cobertura | Recursos IA | Custo | Adequação |
|---|---|---|---|---|
| **Elicit API** (`docs.elicit.com`) | 125M+ papers | Busca semântica, **extração estruturada de campos** (PICO, dosagem, n, espécie), geração de relatórios | Pago (Pro plan, ~$10–79/mês) | ⭐ Melhor match — substitui SciSpace |
| **Semantic Scholar Graph API** | 214M papers | TLDR, embeddings SPECTER, **Recommendations API** (similar papers) | Grátis (com chave) | ⭐ Essencial para "estudos relacionados" |
| **PubMed E-utils** (já temos) | Biomedicina | Sem IA | Grátis | Mantemos como base |
| **OpenAlex** (já temos) | 250M obras | Citações, conceitos | Grátis | Mantemos |
| Consensus, Undermind | Bom para perguntas naturais | Sem API pública aberta no momento | — | Descartado |

**Recomendação:** adicionar **Elicit** (extração estruturada PICO/dosagem alinhada à nossa pipeline de triplas) **+ Semantic Scholar** (similaridade entre papers, fundamental para a parte (c) do plano). Ambos como provedores opcionais ao lado do PubMed/OpenAlex já existentes na "External Search". Elicit exige `ELICIT_API_KEY` (secret); Semantic Scholar exige `SEMANTIC_SCHOLAR_API_KEY` (opcional, mas evita rate limit).

Antes de implementar (b), vou perguntar qual provedor o usuário quer ativar primeiro — não faz sentido pedir 2 chaves de API se ele só quiser uma.

## c) Nova aba "Biblioteca" (pós-curadoria)

Posiciona-se **depois** da Curation, fechando o ciclo:

```
[External Search] ⇢ [Upload] → [AI Processing] → [Curation] → [Library]
```

**Fonte de dados:** `processed_studies` filtrado por `kanban_status = 'approved'` (não mais `scientific_studies`, que vira só staging da busca externa).

**Layout proposto** (master-detail, padrão consagrado para corpus científico tipo Zotero/Paperpile/Connected Papers):

```text
┌─────────────────────────────────────────────────────────────┐
│ Biblioteca · 28 estudos aprovados · busca/filtros           │
├──────────────────┬──────────────────────────────────────────┤
│ Lista (esquerda) │ Detalhe do Estudo (direita)              │
│                  │                                          │
│ ▸ Estudo A       │ ┌──────────────────────────────────────┐ │
│ ▸ Estudo B  ◄    │ │ Título · autores · revista · ano     │ │
│ ▸ Estudo C       │ │ DOI · PDF · score qualidade          │ │
│ ▸ Estudo D       │ ├──────────────────────────────────────┤ │
│                  │ │ Tabs:                                │ │
│ Filtros:         │ │ [Texto] [Triplas] [KG] [Relacionados]│ │
│ - ano            │ │                                      │ │
│ - composto       │ │ • Texto: full_text_content + abstract│ │
│ - condição       │ │ • Triplas: as 4.094 triplas deste    │ │
│ - score          │ │   estudo, agrupadas por predicado    │ │
│                  │ │ • KG: subgrafo (nós que vêm deste    │ │
│                  │ │   estudo, com vizinhos a 1 hop)      │ │
│                  │ │ • Relacionados: outros estudos que   │ │
│                  │ │   compartilham ≥1 tripla/entidade    │ │
│                  │ │   + (opc.) Semantic Scholar similar  │ │
│                  │ └──────────────────────────────────────┘ │
└──────────────────┴──────────────────────────────────────────┘
```

### Boas práticas que vou seguir

1. **Provenance-first**: cada tripla mostrada na aba KG/Triplas terá link clicável para o trecho de texto que a originou (já temos `confidence_rationale` + `mechanism_path` em `triplet_extractions`).
2. **Co-citation graph**: dois estudos são "relacionados" quando compartilham ≥ N entidades (subject/object) em triplas aprovadas — mesma lógica usada por Connected Papers/Litmaps. Implementação 100% SQL, sem custo de API.
3. **Subgrafo por estudo**: já temos `medical_knowledge_graph_edges` com origem por tripla; basta filtrar pelas triplas do estudo. Renderizar com o mesmo `react-force-graph-3d` já em uso (consistência com o KG global).
4. **Texto integral acessível**: usar `processed_studies.full_text_content` (já populado na pipeline) com viewer paginado; PDF original como fallback download.
5. **Bilíngue**: todas as labels via `t()`, novas chaves em PT/EN simultâneas, `I18N_VERSION` incrementada.
6. **Não-mock**: tudo renderizado a partir de dados reais do Supabase (cumprindo o "No-Mock Policy" do projeto).

### Mudanças técnicas

**Frontend** (novos arquivos em `src/components/administrador/estudos/library-curated/`):

- `CuratedLibraryTab.tsx` — container master-detail
- `StudyListPanel.tsx` — lista com busca/filtros
- `StudyDetailPanel.tsx` — header + tabs internas
- `StudyTextView.tsx` — full text reader
- `StudyTripletsView.tsx` — triplas agrupadas por predicado, com origem do trecho
- `StudyKgSubgraph.tsx` — subgrafo react-force-graph-3d filtrado pelo estudo
- `StudyRelatedView.tsx` — outros estudos relacionados (co-tripla + opcionalmente Semantic Scholar)

**Backend / DB** (nova migration):

- View SQL `v_study_related` que para cada `processed_studies.id` retorna outros estudos rankeados por número de entidades compartilhadas via `triplet_extractions` aprovadas.
- (Opcional, se aprovarem Semantic Scholar) Edge function `fetch-related-papers-semanticscholar` chamando `/recommendations/v1/papers/forpaper/{paperId}` com cache em nova tabela `study_external_related`.

**Nav** (`TabNavigation.tsx`):

- Adicionar 5ª aba `library` após `curation`, com badge de contagem de estudos aprovados.

### Documentação

Após implementar: atualizar `ARCHITECTURE.md` (nova tab), `CURRENT_STATE.md` (mockado vs real), e `CHANGELOG.md` em `[Unreleased] → Added/Changed`. Incrementar versões.

## Perguntas antes de implementar

Vou parar aqui e perguntar 2 coisas via `ask_questions`:

1. **Quais provedores externos** ativar agora em "External Search": só manter PubMed/OpenAlex; adicionar Elicit (paga, exige chave); adicionar Semantic Scholar (grátis, melhora "Relacionados"); ou os dois?
2. **Escopo da nova Biblioteca**: começar **enxuta** (lista + texto + triplas + relacionados via co-tripla SQL) e adicionar subgrafo KG depois; ou já entregar **completa** com subgrafo 3D na primeira iteração?

## Fora do escopo deste plano

- Não vou refatorar `scientific_studies` × `processed_studies` (são tabelas separadas por motivo histórico — staging vs curado). Convivência mantida.
- Não vou tocar na Curation, AI Processing nem na pipeline de triplas — só leio os dados que elas produzem.
