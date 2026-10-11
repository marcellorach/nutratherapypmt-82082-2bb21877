# Parecer: aba "Fundamentos Arquiteturais" e o efeito real das regras RC-001 a RC-018

Isto é só análise e não altera nada. A base são buscas somente leitura no código e 2 consultas de leitura ao banco feitas em 11/10.

## 1. Aba
- O id é `fundamentos` e o componente é `FundamentosTab`. Estão em `src/config/admin-tabs.ts:404-409`, no grupo `configuration`. O arquivo da aba é `src/pages/administrador/FundamentosTab.tsx`.
- Quem vê, conforme `role_permissions` para `tab.fundamentos`: **admin** pode editar e **scientist** pode ver. Os outros quatro papéis não têm linha e, por isso, não veem a aba.

## 2. Quem lê `core_rules`, `core_rule_modulators` e `core_rule_evidence` fora da aba
- `supabase/functions/extract-meta-study/index.ts:335`: lê `core_rules` como catálogo para a IA associar o meta-estudo às regras.
- `supabase/functions/chat-meta-study/index.ts:86-94`: lê `core_rule_evidence` com junção em `core_rules` para dar contexto ao chat.
- `supabase/functions/generate-audit/index.ts:129` e `:277` e `generate-showcase/index.ts:42`: só contam linhas para relatórios.
- `src/components/administrador/AboutSenexTab.tsx:105-113`: texto fixo que cita RC-008 e RC-013 como "runtime", o que não é verdade.
- **`hybrid-recommendation`, `generate-triplets`, `sync-approved-triplets`, `kg-evidence-gap-fill` e `triplet-verification-runner` não consultam nenhuma regra nem modulador.** Nenhuma ocorrência em `supabase/functions` fora das funções listadas acima.
- **`core_rule_modulators` só é lido pela própria aba** (`FundamentosTab.tsx:106`). Nenhuma rotina aplica um peso.

## 3. `runtime_effect = 'active'`
- É só um rótulo. Ele é lido apenas em `FundamentosTab.tsx:23` (tipo) e `:180` (selo na tela).
- `IngestaoMetaEstudo.tsx:432` grava `doc_only` quando promove uma regra.
- `generate-audit` (`index.ts:129`) apenas o cita.
- Nenhuma rotina decide comportamento com base nesse campo. Quando uma regra "active" é cumprida, é porque o código tem a lógica escrita de forma fixa, não porque lê a regra.

## 4. Quem escreve
- **`meta_studies`**: `IngestaoMetaEstudo.tsx:264` (ingestão); `MetaStudyKanban.tsx:162/196/211/240/286` (estado, notas e evidências); `evaluate-meta-study-reliability/index.ts:212/281` (a IA sugere a nota de confiabilidade); `generate-meta-study-cover/index.ts:92/111` (a IA gera a capa).
- **`core_rule_evidence`**: `IngestaoMetaEstudo.tsx:333` e `:386` e `MetaStudyKanban.tsx:172`. Todas as gravações vêm da tela, com ação do curador.
- **Promoção de regras propostas, que existe**: `extract-meta-study` (IA) produz `proposed_rules`. O curador marca "promover" em `IngestaoMetaEstudo.tsx:338-439`, e isso gera um novo `RC-NNN` (`:417`) com `proposed_from_meta_study = studyId` (`:434`) e `runtime_effect = 'doc_only'` (`:432`). Não há promoção automática.

## 5. As 18 regras, comparadas com o código

**Cumpridas por lógica fixa no código:**
- **RC-002**: `NEGATIVE_AE_REGEX` em `extract-study-entities/index.ts:492-494`.
- **RC-009**: limite de 8 no esquema e no prompt, em `hybrid-recommendation/index.ts:41` e `:299`. Só o prompt e o esquema impõem o limite; não achei um corte no código.
- **RC-012**: `EdgeRuntime.waitUntil` em `extract-study-entities/index.ts:776-778`.
- **RC-016**: o motor sigmoide existe. A regra está incompleta porque omite o motor Gompertz.

**Cumpridas parcialmente:**
- **RC-001**: só por instrução no prompt da etapa 3 e por um aviso na tela. Está marcada como `doc_only`, o que é coerente.
- **RC-005 (bilinguismo)**: na tela, sim; no banco há lacunas, e eu não auditei.
- **RC-007 (portão da curadoria)**: só triplas aprovadas são enviadas ao grafo, mas o próprio corte de aprovação automática é o tema da RC-013.
- **RC-011, RC-014, RC-015 e RC-017**: existe código relacionado, mas não auditei a cobertura nesta rodada.

**Violadas:**
- **RC-004 (ids canônicos)**: o grafo junta os nós pelo **nome**, em `sync-approved-triplets/index.ts:278` e `:290` e `neo4j-sync/index.ts:160`.
- **RC-008 (SNOMED/UMLS)**: 0 de 191 condições têm esses ids. `import-canonical-ids` só busca OMIA, MeSH e ChEBI (`index.ts:65-95`). Mesmo assim, `AboutSenexTab` a apresenta como "runtime".
- **RC-013 (governança por confiança)**: o código usa `extractionConfidence >= 0.85 && kgMatchScore >= 0.5` (`generate-triplets/index.ts:900`). A regra diz ≥0,70 e a memória diz ≥0,50, ou seja, três números diferentes.
- **RC-006 (No-Mock)**: não verifiquei o caso "A.I. Insights" citado. Fica como suspeita da auditoria, não como fato confirmado por mim.
- **RC-010 (escopo metabólico/degenerativo)**: nenhum filtro desse escopo apareceu nas buscas. Considero não comprovada.

**Só documentação:**
- **RC-003**: planejada; o modulador existe na tabela, mas nada o aplica.
- **RC-018**: `is_demo` é usado de fato no código, mas a regra está marcada `doc_only`. Na prática a lógica existe.

## Conclusão
- Nenhuma regra é aplicada lendo a própria regra no momento da execução. O rótulo `active` quer dizer "existe código que pretende cumprir a regra".
- Das 14 marcadas `active`, pelo menos 3 são violadas pelo código (RC-004, RC-008 e RC-013) e 2 não foram comprovadas (RC-006 e RC-010).

## Sugestões (não implementar sem decisão)
- Trocar o rótulo `runtime_effect` por algo que o código possa verificar: um campo `enforced_at` (arquivo:linha) mais um teste que falhe quando a regra é violada, por exemplo um teste que procure `MERGE ... {name:`.
- Corrigir `AboutSenexTab.tsx:105-113`, que hoje afirma que RC-008 e RC-013 rodam em tempo de execução.
- Reconciliar a RC-013 em um único número antes do portão único da fase A5.
