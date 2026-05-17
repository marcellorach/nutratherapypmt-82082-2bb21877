
## a) Revisão completa da sidebar do admin

Auditei `src/config/admin-tabs.ts` (38 tabs registradas) vs. os 5 grupos (`KnowledgeBaseGroup`, `DataProcessingGroup`, `ActionsGroup`, `ResearchGroup`, `ConfigurationGroup`).

**Achados:**

1. **Duplicatas (mesmo ID em 2 grupos visíveis):**
   - `custo-beneficio` (Análise de ROI) — aparece em Ações **e** em Análise Preditiva. Manter só em Análise Preditiva.
   - `modelos` (Modelos Preditivos) — aparece em Pesquisa **e** em Análise Preditiva. Manter só em Análise Preditiva.
   - `knowledge-base-settings` (Configurações da KB) — aparece em Knowledge Base **e** em Configuração. Manter só em Knowledge Base.

2. **Itens que ficaram sem rota válida** (referenciados na sidebar mas com tab inexistente em `admin-tabs.ts`):
   - nenhum encontrado — todos os itens da sidebar resolvem corretamente após a última rodada.

3. **Tabs registradas mas sem entrada na sidebar (órfãs reais):**
   - `prompts` (AI Prompts) — funcional, importante para administrar prompts de IA. **Adicionar em Configuração.**
   - `database-migrations` (importada em `LazyComponents` mas não registrada) — verificar e remover import se não usada.
   - Demais órfãs já foram restauradas na rodada anterior.

4. **Itens potencialmente sem sentido / a confirmar com você:**
   - **`actions` (Ações em lote)** — grupo "Ações" tem só esse item; conteúdo é genérico. Sugiro **fundir dentro de Processamento de Dados** e eliminar o grupo "Ações" inteiro.
   - **`analytics`** em Configuração — métricas básicas; pode permanecer.
   - **`design-conventions`** — útil só p/ devs; manter em Configuração.

5. **Verificação automatizada:** rodar um script que cruza `adminTabsConfig[].id` × IDs usados nos 5 grupos da sidebar e imprime os deltas, para garantir que nada quebrou.

## b) As alterações da sidebar refletem no Organograma da foto 1?

**Não automaticamente.** São duas fontes diferentes:

- **Sidebar do admin** vem de `src/config/admin-tabs.ts` + `src/components/administrador/sidebar/groups/*`.
- **Organograma (fotos 1–4)** vem de `src/data/projectOrganograma.ts` — arquivo **manual** (memória `mem://architecture/organograma-source-of-truth`).

→ Quando adicionamos/removemos tabs, preciso **também** atualizar `projectOrganograma.ts` manualmente. Vou sincronizar nesta rodada (adicionar `prompts`, remover itens deletados, refletir as fusões).

## c) Diagrama (fotos 2 e 3) — pequeno e descentralizado

Arquivo: `src/components/administrador/organograma/OrganogramaDiagram.tsx`.

Problema: o `fit()` do `useScrollPanZoom` está sendo chamado em `requestAnimationFrame` antes do SVG ter dimensões medidas → resultado fica num canto, escala mínima (`0.05`).

**Correções:**
- Aguardar via `ResizeObserver` no `innerRef` antes do `fit()`.
- Aumentar `fitMin` para `0.3` (era `0.05`) para não centralizar num zoom invisível.
- Forçar refit ao trocar orientação Vertical/Horizontal.
- Adicionar controles `+ / − / Reset` para o usuário ajustar manualmente.
- Garantir `min-height` maior do container.

## d) Grafo (foto 4) — muito embolado

Arquivo: `src/components/administrador/organograma/OrganogramaForceGraph.tsx`.

Problema: a `ForceGraph2D` está com parâmetros padrão → forças fracas, nós colados.

**Correções:**
- Configurar `d3Force`: aumentar repulsão (`charge` ≈ `-300` p/ áreas, `-80` p/ folhas), `linkDistance` maior (≈ `60` para `tree`, `120` para `cross`).
- `cooldownTicks` maior (`300`) e `d3VelocityDecay` menor (`0.25`) para o layout assentar mais espalhado.
- `nodeRelSize` maior nas áreas; folhas com `collisionRadius` para não sobrepor labels.
- Chamar `zoomToFit(400, 80)` após estabilização.

## e) Foto 5 — página "Mapeamento SNOMED-CT / UMLS"

**O que é:** ferramenta interna de governança para mapear cada **condição de saúde** e **nutracêutico** do nosso banco a códigos padronizados internacionais:
- **SNOMED-CT VetSCT** → vocabulário clínico veterinário oficial.
- **UMLS (CUI)** → metatesauro biomédico que unifica vários vocabulários (MeSH, ICD, etc.).

**Para que serve:**
- Padronizar nomenclatura (evita duplicatas tipo "Demodicose" × "Dermatite por Demodicose").
- Permitir interoperabilidade futura (publicar dados, integrar com PubMed, comparar com literatura).
- Habilita o pipeline de Gap-Fill (foto 6) a buscar literatura por CUI em vez de string fuzzy.

**Precisa da API key da UMLS?**
- **Para auto-mapeamento em lote (botão "Auto-map") → sim**, precisa cadastrar a API key da UMLS (gratuita em https://uts.nlm.nih.gov/uts/signup-login).
- **Para mapear manualmente** (editar SNOMED/UMLS de cada entidade) → não precisa.
- Decisão sugerida: **adiar a UMLS API** até começarmos a publicar / integrar com PubMed em escala. Por ora deixar o badge "UMLS API: Não Configurada" e usar mapeamento manual conforme as condições mais críticas.

## f) Foto 6 — página "Diagnóstico do Gap-Fill KG"

**O que é:** painel de inspeção do pipeline de **KG Evidence Gap-Fill** (memória `mem://architecture/kg-evidence-gap-fill-pipeline`).

**Função:** quando o Digital Twin de um pet mostra baixo `years_gained` (poucos triplets cobrem o cruzamento composto×condição), o sistema chama PubMed E-utilities + Gemini para gerar triplets pendentes e preencher o vácuo.

**O painel mostra:**
- Quantas condições/nutracêuticos/condições de pets/triplets gap-fill existem.
- Quais **pet conditions estão "sem condition_id"** (badge vermelho `16 sem condition_id`) → essas não conseguem ser pesquisadas no PubMed porque não estão canonicalizadas.
- Tabela com cada entidade e se tem `name_en` (necessário para query no PubMed).
- Triplets gap-fill pendentes vs aprovados.

**Utilidade prática:** é a "tela de controle de qualidade" antes de rodar gap-fill — você vê o que está faltando ser canonicalizado/traduzido para que o pipeline funcione.

→ **Manter** a tab (é importante), mas adicionar um header explicativo de 2 linhas em cima do título dizendo exatamente isso, para você (e qualquer admin futuro) entender de cara o que faz.

---

## Plano de execução

1. Rodar script de auditoria sidebar × `admin-tabs.ts` × `projectOrganograma.ts` e imprimir o diff.
2. Aplicar correções da seção (a): remover duplicatas, adicionar `prompts` na Configuração, fundir/eliminar grupo "Ações" (após confirmação).
3. Sincronizar `projectOrganograma.ts` com a nova estrutura da sidebar (resposta a (b)).
4. Corrigir `OrganogramaDiagram.tsx` (fit/centralização — c).
5. Corrigir `OrganogramaForceGraph.tsx` (d3Force / espalhamento — d).
6. Adicionar header explicativo no topo de `GapFillDiagnosticsTab` (f).
7. Adicionar nota inline na `OntologyMappingTab` explicando quando a UMLS API é/não é necessária (e).
8. i18n PT/EN para todos os textos novos, bump `I18N_VERSION`, entrada no `CHANGELOG.md` e `npm run sync:changelog`.

## Confirmações que preciso antes de implementar

1. **Grupo "Ações"** (que hoje só tem 1 item, "Ações em lote") — posso **eliminar o grupo e mover o item para Processamento de Dados**? Ou manter como está?
2. **`prompts` (AI Prompts)** — confirmo que entra em **Configuração** (atualmente é órfão mas funcional)?
3. **UMLS API** — confirma que por ora **NÃO** vamos configurar a API key (mapeamento só manual)?
