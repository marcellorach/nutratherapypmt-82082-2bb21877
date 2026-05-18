## Contexto

O modal aberto pelo botão "i" do tab **Administrador → Estudos** é renderizado por `TabInfoButton.tsx` a partir de um objeto de dados. Hoje há duas fontes desalinhadas:

- `src/data/admin-tabs-info.ts` (legado, monolíngue PT) — **está sendo usado** pelo `EstudosHeader.tsx`. Versão atual `v4.0.0`, Last Update `2025-12-24`. É a fonte do print.
- `src/data/admin-tabs-info-bilingual.ts` (bilíngue PT/EN, lido por `getLocalizedTabInfo`) — existe mas está parado em `v3.1.0` / `2025-11-30` e não é consumido pelo Estudos.

Isso explica os 4 problemas reportados:

1. **Desatualizado**: data fixa em dezembro/2025, conteúdo não acompanha o que entrou em produção (gap-fill, KG evidence pipeline, treatment proposals etc.).
2. **Estudos irrelevantes/superficiais**: o card "Key Excerpts" mistura papers de GraphRAG com referências genéricas (ex.: AAHA Senior Care como excerpt principal) e não cobre os pilares reais do motor (Dog Aging Project, geroprotetores, biomarcadores de idade biológica, AAHA Nutritional Assessment, WSAVA, Frailty in dogs etc.).
3. **Referências fracas**: `references[]` tem só 5 itens e mistura ferramenta (VeNom) com guideline com base de dados.
4. **Mistura PT/EN**: o `EstudosHeader` consome o arquivo PT, mas a label do diálogo (header + headers da tabela) é traduzida via i18n → quando UI está em EN, o cabeçalho fica em EN e o conteúdo das linhas fica em PT. Além disso, o `architectureDiagram` é uma string única (sem variante PT/EN).

## Objetivo

Tornar o modal **bilíngue de verdade, atualizado, com curadoria honesta** e visualmente caprichado (tabelas + diagrama + glossário + status real de implementação), sem inventar resultados.

## Plano de execução

### 1. Trocar a fonte do `EstudosHeader` para a bilíngue

- Em `src/components/administrador/estudos/EstudosHeader.tsx`, importar `adminTabsInfoBilingual` (passa pelo `getLocalizedTabInfo` que já existe no `TabInfoButton`) em vez de `adminTabsInfo`.
- Manter o arquivo legado intacto para os outros tabs que ainda o usam (não está no escopo).

### 2. Reescrever a entrada `'estudos'` em `admin-tabs-info-bilingual.ts`

Bump obrigatório de versão e data:

- `version: '5.0.0'` (major: reescrita completa do conteúdo)
- `lastUpdate: '2026-05-18'`
- Adicionar pequena instrução de manutenção no topo do arquivo (comentário) lembrando que **toda mudança no motor exige bump + nova data**.

### 3. Curadoria de **Key Excerpts** (cabeçalho do modal)

Manter **6 excerpts**, todos diretamente ligados ao que o motor faz hoje. Para cada um: `source`, `quote` bilíngue (PT + EN) e `url` verificável.

| # | Paper | Por que pertence ao motor Senex |
|---|---|---|
| 1 | **MedGraphRAG** (Wu et al., 2024, arXiv:2408.04187) | Triple Graph Construction + U-Retrieval — base da hierarquia L0-L4 |
| 2 | **KGARevion** (Su et al., ICLR 2025) | Ciclo GRRA usado na validação de triplets e auto-approve threshold |
| 3 | **TransE** (Bordes et al., NeurIPS 2013) | Link prediction (`h+r≈t`) usado no gap-fill |
| 4 | **Dog Aging Project — Open Data** (Creevy et al., Nature 2022 / GeroScience) | Coorte longitudinal real que fundamenta a curva de Digital Twin canino |
| 5 | **AgeXtend** (Ahuja et al., Nature Aging 2024) | Plataforma de predição multiômica de geroprotetores — referência direta do nosso scoring de longevidade |
| 6 | **Frailty in Dogs** (Banzato et al., Front. Vet. Sci. 2019) e **AAHA Senior Care Guidelines 2023** | Operacionalização clínica do fenótipo de fragilidade que o motor monitora |

Remover os excerpts genéricos sobre nutracêuticos isolados — eles ficam nas referências.

### 4. Reescrever a tabela comparativa (`methodology.comparisonTable`)

Manter 4 colunas: `Feature | MedGraphRAG | KGARevion | Senex AI`, mas:

- Garantir **PT e EN** em **headers + feature + values** (a primeira coluna hoje vaza PT no modo EN).
- Substituir as últimas 4 linhas (atualmente em PT puro: "Geroprotetores...", "Quantificação...", "Species→...", "TransE...") por strings bilíngues completas.
- Adicionar 2 linhas novas que refletem o que foi entregue depois da v3.1:
  - **PubMed Gap-Fill** (referência: `kg-evidence-gap-fill` edge) → "Não coberto / Não coberto / E-utilities + Gemini + triplet pendente automático".
  - **Digital Twin Longitudinal** → "Não coberto / Não coberto / Sigmoid projection + years_gained scoring".

### 5. Diagrama de arquitetura

- Trocar o ASCII art atual por **Mermaid** dentro do mesmo campo (`architectureDiagram`), com 4 fases (Ingestion → Extraction → 5-Layer KG → GRRA + Gap-Fill) e o output (Recommendation + Digital Twin). Mermaid renderiza igual em PT/EN, então elimina mistura.
- Verificar/ajustar o `TabInfoButton` para detectar string Mermaid (começa com `graph`/`flowchart`) e usar o `MermaidBlock` já existente em `src/components/shared/MermaidBlock.tsx` em vez do `<pre>` atual. Fallback continua sendo `<pre>` se não for Mermaid.

### 6. Reescrever **Scientific Foundations**

Em `scientific`:

- **`foundation`** (PT/EN): reformular para 4 pilares (MedGraphRAG, KGARevion, TransE, **Canine Geroscience — Dog Aging Project + AgeXtend**).
- **`implementationStatus`** (`implemented / inProgress / planned`): refletir o estado real de hoje conforme `.lovable/CONTEXT.md` e CHANGELOG (gap-fill já em produção, Digital Twin com sigmoid pronto, Neo4j ainda planejado, etc.). Sem promessas vazias.
- **`studies`** (lista detalhada): expandir para 8–10 papers, cada um com `title` PT/EN, `authors`, `year`, `journal` PT/EN, `url` real e `keyFindings` PT/EN. Cobertura proposta:
  1. MedGraphRAG (Wu 2024)
  2. KGARevion (Su 2025)
  3. TransE (Bordes 2013)
  4. Dog Aging Project (Creevy 2022)
  5. AgeXtend (Ahuja 2024)
  6. Rapamycin TRIAD trial (Kaeberlein et al.)
  7. Senolytics review (Kirkland & Tchkonia 2020) — fundamenta classe de compostos
  8. Frailty index in dogs (Banzato 2019)
  9. AAHA Nutritional Assessment Guidelines (2021)
  10. WSAVA Global Nutrition Toolkit (2021)
- **`references`**: limpar e separar em 3 grupos visualmente (guidelines, ontologias, datasets). Como o renderizador atual aceita só `string[]`, usaremos prefixos curtos (`[Guideline]`, `[Ontology]`, `[Dataset]`, `[Paper]`) para deixar legível sem mexer no componente.

### 7. Glossário e limitações

- Manter o `glossary` bilíngue e acrescentar 3 termos novos relevantes: `Digital Twin`, `Years Gained`, `Gap-Fill Triplet`.
- Atualizar `limitations` para o estado real (remover itens já resolvidos como "Title extraction", manter Neo4j ainda fora, TransE parcial, etc.).

### 8. Reforçar a data como obrigatória

No `TabInfoButton.tsx`, hoje a data é renderizada apenas se `lastUpdate` existir. Vou:

- Tornar o badge "Last Update: YYYY-MM-DD" sempre visível e estilizado (chip ao lado da versão).
- Se faltar `lastUpdate` no objeto, mostrar `—` com tooltip "Required — bump on every edit", garantindo que qualquer regressão futura fique óbvia.

### 9. i18n + housekeeping (obrigatório pela regra do projeto)

- Bump `I18N_VERSION` em `src/i18n.ts`.
- Adicionar (PT e EN) eventuais novas chaves do `TabInfoButton` (ex.: `admin.tabInfo.lastUpdate.required`, `admin.tabInfo.scientific.studies`, `admin.tabInfo.scientific.references`, agrupamentos).
- Entrada no `CHANGELOG.md` em `[Unreleased]` com header `<!-- area: admin/estudos · status: done · i18n: yes -->` + rodar `npm run sync:changelog` (regenera `projectChangelog.generated.ts` e briefing).
- `projectOrganograma.ts` não muda (estrutura de tabs preservada).

## Verificação após implementação

1. `npx tsc --noEmit` — 0 erros.
2. `npx vitest run` — manter os 94 testes verdes.
3. Preview: abrir `/administrador?tab=estudos`, clicar no "i", alternar PT/EN e conferir:
   - badge de versão = `v5.0.0`, "Last Update: 2026-05-18" visível em ambos idiomas;
   - nenhum trecho misturado (sem PT em UI EN e vice-versa);
   - Mermaid renderiza nas duas abas;
   - todos os links de papers abrem (smoke test em 2-3).

## Fora do escopo

- Não alterar nenhum outro tab admin (regra do projeto: não tocar em outras páginas).
- Não migrar os demais tabs do arquivo legado para o bilíngue agora — fica para um follow-up se você quiser.
- Não publicar nem mudar landing/marketing.
