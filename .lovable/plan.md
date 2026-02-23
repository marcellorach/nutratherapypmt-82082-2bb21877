
# Corrigir Inconsistencias nos Stats do Knowledge Graph

## Problemas Identificados

### Problema B: Todos os cards abrem o mesmo dialog
O mapeamento `cardIdToStatType` no `openStatDialog` (linha 595-617 de KnowledgeGraphViewer.tsx) faz varios cards apontarem para o mesmo dialog:
- `pathways` -> `ontology` (abre "Ontology Entities" generico)
- `outcomes` -> `ontology` (mesmo dialog)
- `ontology-chebi` -> `ontology` (mesmo dialog)
- `nutraceuticals` -> `nutraceuticals` (correto mas usa Neo4j, nao a tabela `nutraceuticals`)
- `conditions` -> `conditions` (correto mas usa Neo4j)

**Solucao**: Criar stat types especificos para cada card e carregar dados da tabela correta. Ex: `pathways` deve abrir um dialog com dados de pathways, `nutraceuticals` deve listar da tabela `nutraceuticals`, etc.

### Problema D: Pathways = 0 vs Graph Nodes mostra pathways
- O card "Pathways" na Base de Conhecimento conta da tabela `pathway_nodes` (linha 94 de useKnowledgeGraphStats.ts) = **vazia**
- O dialog "Graph Nodes" filtra por tipo "Pathway" no Neo4j onde existem AMPK, mTOR, NF-kB etc.
- Essas entidades existem na `veterinary_ontology` como type `pathway` / layer `layer_2_mechanism` mas o card nao conta de la

**Solucao**: Mudar a query do card "Pathways" para contar pathways da `veterinary_ontology` (onde realmente existem) em vez da tabela `pathway_nodes` (vazia e sem uso).

## Mudancas Tecnicas

### 1. `src/hooks/useKnowledgeGraphStats.ts`
- Substituir a query de `pathway_nodes` por query em `veterinary_ontology` filtrando por `entity_type = 'pathway'` ou `layer LIKE '%pathway%'`
- Isso corrige o "0" no card Pathways

### 2. `src/components/administrador/visualizations/KnowledgeGraphViewer.tsx`
- Expandir o union type `StatType` para incluir: `'pathways'`, `'outcomes'`, `'chebi'`, `'entities-ai'`, `'relations-ai'`, `'approved-triplets'`, `'pending-triplets'`
- Atualizar `openStatDialog` para mapear cada card ID ao seu tipo especifico em vez de colapsar tudo em `'ontology'`

### 3. `src/components/administrador/visualizations/KnowledgeGraphStatDialog.tsx`
- Adicionar suporte aos novos stat types:
  - `pathways`: carrega pathways da `veterinary_ontology` WHERE entity_type='pathway'
  - `outcomes`: carrega da tabela `outcome_families`
  - `chebi`: carrega da `veterinary_ontology` WHERE source='ChEBI'
  - `entities-ai`: carrega da `veterinary_ontology` WHERE source='gemini_extraction'
  - `relations-ai`: carrega de `hierarchical_edges` com study_ids
  - `approved-triplets`: carrega de `triplet_extractions` WHERE curation_status='approved'
  - `pending-triplets`: carrega de `triplet_extractions` WHERE curation_status='pending'
- Cada tipo tera titulo, descricao e renderizacao proprios

### 4. Traducoes
- Adicionar chaves i18n para os novos tipos de dialog (titulos e descricoes)
- Atualizar `src/locales/pt/translation.json` e `src/locales/en/translation.json`
- Incrementar versao no `src/i18n.ts`

## Sobre o Ponto A (Patient Analysis)
Para testar o Patient Analysis, o caminho e: pagina do veterinario -> selecionar um pet -> clicar "Analisar com VetGraphRAG". Isso requer ter um pet cadastrado no sistema. Se nao houver pets, precisaremos usar dados de teste. Isso sera tratado separadamente apos estas correcoes.

## Sobre o Ponto C ("Aguardando processamento")
O status "Aguardando processamento" indica que o estudo foi importado mas o pipeline de extracao de triplets ainda nao rodou para ele. Isso e comportamento esperado - quando voce processar os 30 novos estudos, eles passarao por esse estado antes de terem triplets extraidos.

## Arquivos Afetados
1. `src/hooks/useKnowledgeGraphStats.ts` - corrigir query de pathways
2. `src/components/administrador/visualizations/KnowledgeGraphViewer.tsx` - expandir StatType e mapeamento
3. `src/components/administrador/visualizations/KnowledgeGraphStatDialog.tsx` - adicionar renders para novos tipos
4. `src/locales/pt/translation.json` - novas chaves
5. `src/locales/en/translation.json` - novas chaves
6. `src/i18n.ts` - incrementar versao
