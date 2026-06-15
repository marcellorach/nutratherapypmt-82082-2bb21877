## Diagnóstico do retorno fraco

Confirmei no banco:

| Fonte | Status real | Por que apareceu fraco/vazio |
|---|---|---|
| **KG curado (w=1.00)** | **127 triplets com "curcum"** existem em `triplet_extractions` | Bug: `kgProvider` chama `get_relations_graph_data(p_limit:500)` e **filtra keyword client-side**. Se curcumina não estiver nas 500 primeiras edges retornadas, some. Não busca por termo no DB. |
| **Histórico do cão (w=0.95)** | — | Playground roda **sem `petId`** (é tela admin global). Provider sai cedo retornando vazio — esperado nesse contexto, mas a UI exibe "—" sem explicar. |
| **Cohort sintético (w=0.70)** | 39% / 77-de-200 | "Match" é só substring das palavras da própria query (`curcumina, segura, golden`) em `breed`+`notes`. **Não é sinal clínico real** — é eco lexical. Por isso a síntese ficou tautológica ("39% mencionam curcumina, segura, golden"). |
| **Cães tratados (w=0.60)** | Stub | Honesto. |
| **Internet (Perplexity, w=0.30)** | OK | Única fonte que entregou conteúdo de verdade. Por isso a tela parece "só Perplexity". |

**Síntese final do resolver pegou o claim do Cohort** (peso 0.70) ignorando que era circular, em vez de promover o Internet (rico, mas peso 0.30). Daí o resumo pobre no topo.

## Escopo do plano

### 1. KG provider — buscar por termo no DB, não filtrar 500 linhas aleatórias
- Criar/usar RPC `search_relations_by_term(p_terms text[], p_limit int)` que faz `ILIKE` em `subject_name`/`object_name` de `triplet_extractions` (curation_status = 'approved' OU auto_approved) e devolve as edges com `evidence_level`, `intensity`, `confidence`, `mechanism_path`, `study_id`.
- `kgProvider` passa a chamar essa RPC com as keywords extraídas. Sem match → mantém `claim:null` e confiança 0 (sinal honesto).
- Tipar e expor `mechanism_path` no `evidence[]` para alimentar o diagrama (item 3).

### 2. Cohort provider — match clínico, não lexical
- Parar de fazer substring em `notes`. Em vez disso:
  - Extrair do `question` entidades canônicas (compound, condition, breed, lab marker) via lookup leve nos dicionários `taxonomy_*` que já temos.
  - Filtrar `pet_profiles` por `breed` + presença de condição/lab nas tabelas relacionadas (ex.: `pet_conditions`, `pet_lab_results`).
  - Se não houver entidade canônica reconhecida → devolver `claim:null` com nota "sem entidade clínica reconhecida na pergunta" em vez de eco da query.
- Síntese passa a ser do tipo "X% dos N Goldens sintéticos com ALT elevada têm tag de hepatoprotetor", não "X% mencionam as palavras da pergunta".

### 3. Síntese final — promover o mais informativo, não o de maior peso
- Quando a fonte de maior peso tiver `claim:null` OU `confidence < 0.4`, **degradar** para a próxima fonte com claim substantivo.
- Marcar visualmente quando a síntese veio de fonte de peso baixo ("Síntese baseada em Internet (w=0.30) — KG sem cobertura para este termo").

### 4. Histórico do cão no Playground admin
- Tela é global (sem pet). Trocar "—" mudo por estado explícito: "Não aplicável neste contexto (playground sem pet selecionado). Use a tela clínica do pet para esta fonte." 
- Opcional: dropdown de pet demo para testar o provider sem sair da tela.

### 5. Diagrama de sistemas biológicos/moleculares envolvidos
Componente novo `MechanismDiagram` renderizado **dentro do card do KG** (e também na síntese) quando o KG retorna pelo menos 1 edge:
- **Fonte de dados:** `mechanism_path` + cadeia `compound → molecular_target → pathway → physiological_effect → outcome` já presente nas triplets aprovadas (a ontologia de 5 camadas que já existe — `vetgraph-rag-2-0-five-layer-ontology`).
- **Render:** Mermaid (`text/vnd.mermaid` artifact + componente Mermaid já usado no projeto) com cores por camada da ontologia e setas com notação biológica (`→` ativa, `⊣` inibe) conforme o padrão `biological-legend-standard-notation`.
- **Exemplo para curcumina/ALT:** `Curcumina ⊣ NF-κB → ↓ TNF-α/IL-6 → ↓ Inflamação hepatocitária → ↓ ALT/AST` + nó lateral `Piperina → ↑ absorção (cuidado em hepatopatia)`.
- Toggle "Mostrar mecanismo" no card do KG; persistente por sessão.
- Sem dado de mecanismo → não renderiza (não inventa).

### 6. Detalhes técnicos
- Nova migração: RPC `search_relations_by_term`.
- `multi-source-resolver.ts`: refactor de `kgProvider` e `cohortProvider`; ajuste do `synthesis()`.
- Novo `src/components/clinical/MechanismDiagram.tsx` usando wrapper Mermaid já existente.
- `SourcePanel.tsx`: slot opcional para renderizar o diagrama abaixo do claim do KG.
- i18n: incrementar `I18N_VERSION`, adicionar chaves em PT/EN para os novos estados ("Sem cobertura no KG", "Síntese degradada", "Mostrar mecanismo", etc.).
- Sem mock: se KG/cohort não retornam, exibir estado honesto.

### 7. Fora deste plano (registrar como backlog)
- Embedding-based KG search (substituir ILIKE por similaridade vetorial usando `study_embeddings`).
- Gap-fill PubMed automático quando KG não cobre (já existe pipeline `kg-evidence-gap-fill`, mas não está plugado no playground).
- Conectar `treatedDogs` provider a dados reais quando houver cohort tratado.

## Critério de validação
Repetir a mesma pergunta ("Curcumina é segura para Golden Retriever com elevação leve de ALT?") e ver:
- KG card: claim com triplet real (não "—"), 1+ evidência, diagrama de mecanismo renderizado.
- Cohort card: claim clínico OU "sem entidade reconhecida", nunca eco da query.
- Síntese: vem do KG quando existe; degrada explicitamente quando não.
- Histórico: estado "não aplicável" claro.
