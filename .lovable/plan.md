
Diagnóstico verificado (estado atual)
1) Sim, o app consulta o VetGraphRAG hoje (via backend function `graph-rag-search`), mas no seu caso as queries estão falhando por nome:
- `Heart Disease` → 0 nós/0 relações
- `Canine Cognitive Dysfunction Syndrome (CDS)` → 0 nós/0 relações
2) O grafo está vivo e grande (não está vazio): ~1938 nós e ~3430 relações. Ex.: `Cardiovascular Disease` e `Cognitive Dysfunction Syndrome` retornam dados.
3) Há um bug crítico no fluxo de recomendação:
- modo `enrich` retorna só texto (`enrichment`)
- pipeline espera `nutraceuticals[]`
- resultado: lista vazia e UI cai em `generateMockCompounds(...)` (por isso aparecem sempre as mesmas recomendações).
4) Há também problema de matching por regex/termo:
- termos com parênteses (ex.: `(CDS)`) quebram o match regex atual
- nomes clínicos dos pets não estão canônicos para o grafo (ex.: `Heart Disease` vs `Heart failure`/`Cardiovascular Disease`).

Direção aprovada por você
- Fallback: permitir IA sem KG.
- Estratégia de nomes: mapear internamente + migrar dados existentes.

Plano de implementação
1) Corrigir contrato da recomendação híbrida (fim do mock “mascarado”)
- Ajustar `hybrid-recommendation` para sempre retornar payload estruturado (`nutraceuticals`, `rationale`, `precautions`) também em `enrich` (não só texto livre).
- No pipeline, tratar robustamente parse/falha sem cair em mock estático.
Arquivos:
- `supabase/functions/hybrid-recommendation/index.ts`
- `src/services/clinical-analysis-pipeline.ts`

2) Canonicalização real de condições antes de consultar KG
- Criar resolução de termos clínicos para nomes canônicos (via `veterinary_ontology` + heurística/aliases).
- Exemplo esperado:
  - `Heart Disease` → tentar `Cardiovascular Disease`, `Heart failure`
  - `Canine Cognitive Dysfunction Syndrome (CDS)` → `Canine Cognitive Dysfunction Syndrome`, `Cognitive Dysfunction Syndrome (CDS)`
- Consultar KG com termos candidatos até obter hit.
Arquivo:
- `src/services/clinical-analysis-pipeline.ts`

3) Tornar a query de contexto do grafo resiliente
- Escapar caracteres regex do `sourceEntity` (parênteses, +, etc.).
- Adicionar fallback `toLower(name) CONTAINS ...` para não depender só de regex.
Arquivo:
- `supabase/functions/graph-rag-search/index.ts`

4) Remover fallback mock da tela clínica
- Em `PetProfilePage`, parar de usar `generateMockCompounds` quando a análise vier vazia.
- Exibir estado explícito:
  - “LLM-only (sem evidência KG para esta condição)” quando aplicável.
  - badges de fonte: KG / Híbrido / LLM-only.
Arquivo:
- `src/pages/veterinario/PetProfilePage.tsx`

5) Migrar dados existentes (mapear + migrar)
- Atualizar `pet_conditions` existentes para nomes canônicos e preencher `condition_id` quando possível.
- Atualizar gerador de pets de exemplo para gravar nomes canônicos já alinhados ao grafo.
Arquivos:
- `src/components/pet/GenerateSamplePetsButton.tsx`
- (operação de dados no backend para atualizar registros existentes)

6) Garantir função de insights clínicos ativa
- Verificar disponibilidade/deploy de `condition-insights` (hoje está retornando 404 no endpoint).
- Tratar erro no hook sem quebrar experiência (degradação elegante).
Arquivos:
- `src/hooks/useConditionInsights.ts`
- backend function `condition-insights` (deploy/registro)

Validação (aceite)
1) Para Luna:
- Stage KG deixa de mostrar 0 absoluto quando há termo equivalente no grafo.
- Recomendações deixam de ser o bloco fixo Curcumin/NMN/Resveratrol/Omega-3.
2) Entre pets diferentes:
- conjuntos de compostos e racional clínico passam a variar por condição/exames/medicações.
3) Quando não houver KG:
- sistema ainda recomenda via IA (como você escolheu), mas com rótulo claro “LLM-only”, sem mock estático.
4) Conferência técnica:
- requests de KG mostram termos canônicos/mapeados;
- respostas de recomendação trazem `nutraceuticals[]` estruturado em todos os modos.
