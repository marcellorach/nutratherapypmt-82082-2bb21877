# Parecer técnico: decisão A, fonte de verdade do conhecimento (P7 "livro-razão + vista")

Isto é só análise. Não implementa nada. Se for aprovado, a única entrega é este parecer, sem mudança no código, no banco ou nos docs. Marcello decide.

Base: duas buscas somente leitura no repositório feitas em 11/10. Os números do banco vêm da auditoria e não foram consultados de novo.

## 1. O que já existe

- **Escrita auditável no Postgres (parcial).** `triplet_extractions` já guarda a curadoria (`curation_status`), `evidence_polarity`, o trecho de origem e o estudo. Também existem `processed_studies`, `study_extractions`, `extraction_item_reviews` (marcação do curador em condições e doses) e `core_rules` / `core_rule_evidence` / `core_rule_modulators` (livros de regras, em parte).
- **Envio ao Neo4j (parcial e incremental).** Existem `sync-approved-triplets`, `neo4j-sync`, `sync-study-to-neo4j` e `sync-ontology-to-neo4j`. Nenhuma delas reconstrói o grafo inteiro. A busca por "rebuild" ou `DETACH DELETE` só encontrou `generate-audit`.
- **O MERGE usa o nome, não o id canônico.** Exemplos: `sync-approved-triplets/index.ts:278` e `:290` (`MERGE (subject:Label {name: $subject_name})`) e `neo4j-sync/index.ts:160` (`MERGE (n:Nutraceutical {name: $name})`). Isso explica os 573 nós Nutraceutical para 30 nutracêuticos no catálogo.
- **Ids canônicos.** As colunas `canonical_id` e `canonical_source` existem em `health_conditions` e `nutraceuticals`. Também existem `import-canonical-ids` (função e `scripts/import-canonical-ids.ts`), `scripts/parsers/mesh-xml.ts`, `chebi-obo.ts` e `omia-xml.ts`, além de `canonical_resolutions`.
- **Juiz independente.** `triplet-verification-runner`, `triplet_verifications` e `verification_controls` existem, mas o juiz nunca rodou.
- **Lacunas.** `kg-evidence-gap-fill` já busca primeiro no PubMed.
- **Conflitos de evidência.** As tabelas `evidence_claims` e `evidence_conflicts` existem, mas estão vazias.
- **Quem escreve em `hierarchical_edges`.** A busca encontrou só um ponto: `consolidate-knowledge-graph/index.ts:181`. Quem lê: `useKnowledgeGraphStats.ts`, `useSankeyData.ts`, `useSystemGuideStats.ts`, `SourcePanel.tsx`, `PipelineDashboard.tsx`, `SystemGuideDetailPanel.tsx`, `KnowledgeGraphStatDialog.tsx`, `complianceData.ts`, e no servidor `generate-triplets`, `batch-reprocess-triplets`, `kg-missing-triplets`, `generate-showcase` e `generate-audit`.
- **Registro de recomendações.** Nenhuma função do servidor grava em `recommendation_logs`. A única referência fica no cliente (`src/services/hybrid-recommendation-service.ts`). Isso explica o 0 da auditoria. A função `hybrid-recommendation` também não lê `evidence_polarity`, então hoje uma evidência negativa não bloqueia nada.

## 2. O que falta e esforço estimado

- **A0, declarar (P).** ADR mais a correção de 3 docs (ver item 5).
- **A1, proveniência, ids, dedupe e o tipo Mecanismo do envelhecimento (G).** Falta trocar o MERGE por nome pelo MERGE por `canonical_id` nas 4 funções de envio. Faltam ainda deduplicar os 573 nós, ligar `pet_conditions.condition_id` (hoje 1.315 de 1.315 estão vazios), normalizar a raça e terminar o parser MeSH. Os 12 marcadores do envelhecimento já estão parcialmente no enum. Dá para usá-los como tipo de nó em vez de condição, o que também resolve as 54 condições órfãs.
- **A2, notas GRADE adaptadas e regras assinadas (G).** Falta o modelo de dados das notas por afirmação, com `species_scope`, desenho do estudo, n e efeito. Também faltam os pesos de translacionalidade curados (o RC-003 existe mas está desligado) e a assinatura das regras de dose e de laboratório. `lab_reference_ranges` não tem nenhum consumidor.
- **A3, rotina de regeneração e troca da tela Relações (G).** A rotina tem de ser idempotente, rodar em lotes por fila (o limite de tempo de uma função não comporta 4 mil triplas mais os nós), conferir contagens antes e depois e fazer backup antes do delete físico, que já é uma exceção registrada. Além disso, é preciso migrar 8 telas e hooks e 5 funções que leem `hierarchical_edges`.
- **A4, pacotes de evidência citáveis, citação obrigatória, registro e Cypher fixo (M/G).** O registro é P, porque basta passar a gravar `recommendation_logs` no servidor. O pacote de evidência com ids e o prompt que exige citação são M. Restringir o Cypher a rotas fixas é M, porque o chat do grafo hoje gera Cypher livre.
- **A5, portão único com juiz, fila de lacunas e tabela de desfechos (GG).** O juiz nunca rodou e tem custo de IA. Os desfechos (`outcome_observations`) dependem do estado C.

## 3. Onde discordo ou vejo risco

- **"Regenerar inteiro" como rotina normal.** Concordo com a ideia, mas não como única forma de atualizar. Recriar 4 mil arestas e milhares de nós no Aura a cada aprovação custa tempo e operações, e deixa o grafo meio vazio durante a carga. Proposta: rotina **incremental idempotente** por padrão (MERGE por id canônico mais `source_version`) e regeneração completa apenas para reconciliar, sob comando, com uma conferência que compara as contagens do Postgres com as do Aura.
- **O sync por efeito colateral não é o problema central.** O defeito é a **identidade por nome**. Com MERGE por id, o efeito colateral passa a ser aceitável. Corrigir a identidade antes de mexer no gatilho tem o maior retorno.
- **Aposentar `hierarchical_edges` direto causa regressão.** São 13 consumidores, entre eles o Sankey, as estatísticas, o painel de fontes e o showcase. Proposta: congelar a tabela (parar `consolidate-knowledge-graph`), apontar os consumidores para uma vista no Postgres sobre as triplas aprovadas (ver item 4) e só depois remover a tabela, com backup.
- **"Neo4j como única vista de leitura do produto".** Isso me preocupa. Torna o Aura um ponto único de falha, com plano pago, latência e indisponibilidade, e coloca as telas de admin e as contagens na dependência de Cypher. Sugiro que o produto clínico leia do Aura, enquanto as telas de admin, as estatísticas e as auditorias leiam uma **vista no Postgres** da mesma fonte.
- **GRADE adaptado sem curador disponível vira campo vazio.** Hoje nem a marcação de condições e doses tem volume. Recomendo calcular automaticamente o que dá (desenho, n e espécie vêm da extração) e deixar para o curador apenas o peso de translacionalidade e a assinatura.
- **SNOMED depende de licença e de chave.** É certo atrasar. MeSH e ChEBI cobrem o essencial agora, e OMIA cobre as raças.

## 4. Alternativas

- **Ordem diferente:** A0, depois A1 só com identidade e dedupe, depois um pedaço barato do A4 (gravar `recommendation_logs` e fazer `hybrid-recommendation` respeitar `evidence_polarity`), depois A3 e por fim A2 e A5. Assim o produto fica auditável já, sem esperar o modelo GRADE.
- **Modelagem mais simples.** Criar uma vista materializada no Postgres, `knowledge_assertions`, sobre `triplet_extractions` aprovadas, com a junção pelos ids canônicos. Ela seria a fonte única para o envio ao Aura e para as telas de admin, e substituiria `hierarchical_edges` sem uma nova tabela de escrita.
- **Catálogo inicial** (`nutraceuticals` e os 77 pares em `nutraceutical_conditions`): trazê-lo para o livro-razão como afirmações de origem "curadoria manual", com grau próprio. Não deve ficar como uma terceira versão do conhecimento.

## 5. Conflitos com os docs e o conhecimento atuais

- `docs/STATE_REAL_VS_MOCK.md:13` e `docs/generated/DATA_PROVENANCE.md:10` chamam `hierarchical_edges` de "fonte real do grafo". Isso contradiz o conhecimento do projeto, segundo o qual a fonte são as triplas aprovadas e `hierarchical_edges` é uma projeção não curada. Os dois arquivos precisam ser corrigidos, e o segundo deve ser corrigido no gerador `scripts/generate-data-provenance.mjs`.
- `docs/generated/ARCHITECTURE_LIVE.md` diz que o código "É sigmoide" e que Gompertz seria um erro. Isso contradiz o conhecimento do projeto, que fala em dois motores. A correção deve ser feita no gerador.
- A mesma matriz registra 3 limiares de aprovação automática sem reconciliação (0,85 com 0,50; RC-013 com 0,70; e 0,50 na memória). O portão único da fase A5 precisa decidir isso.
- A memória "Canonical IDs" diz que se deve usar o UUID do Supabase como id do nó, mas o código faz MERGE por `name`. A memória descreve uma intenção, não o estado atual.

## 6. Próximos passos sugeridos

1. ADR da decisão A, com as ressalvas acima.
2. Contar e deduplicar os nós por nome no Aura (somente leitura primeiro), para medir o tamanho do problema de identidade.
3. Gravar `recommendation_logs` no servidor e bloquear afirmações com `evidence_polarity='negative'`. É barato e aumenta a segurança clínica.
4. Congelar `consolidate-knowledge-graph`.
5. Rodar uma vez o `triplet-verification-runner` numa amostra pequena, com custo aprovado, para saber se o juiz funciona antes de construir o portão sobre ele.

Ficam pendentes: a escolha entre regenerar tudo ou atualizar incrementalmente, se o admin lê o Aura ou o Postgres, e a ordem das fases. Todas são decisões de Marcello.
