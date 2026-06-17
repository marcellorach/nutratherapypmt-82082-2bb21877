# Project context briefing (auto)
Generated: 2026-06-17T00:52:33.871Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.120.0

## Changes by area (last 14 days)
- **admin**: 7
- **meta**: 6
- **kg**: 3
- **curation**: 1

## Top 10 recent entries
### 2026-06-15 · [kg] FIXED — Playground multi-fonte: KG busca por termo real + cohort canônico + diagrama de mecanismo
- Root cause (KG vazio para curcumina): `kgProvider` em `src/services/multi-source-resolver.ts` chamava `get_relations_graph_data(p_limit:500)` e filtrava as keywords client-side. Curcumina existe (127 triplets em `triplet_extractions`), mas não nas 500 primeiras edges — daí "Knowledge Graph curado: —" em uma pergunta que o KG cobre amplamente.
- Fix KG: nova RPC `public.search_relations_by_term(p_terms text[], p_limit int)` faz `ILIKE` direto em `subject_name`/`object_name` filtrando `curation_status='approved' OR auto_approved=true`, ordenando por `llm_confidence`. Provider passa a chamar a RPC. Validado: pergunta de curcumina retorna 10+ relações (Curcumin ⊣ NF-κB, ↑ Nrf2, ↓ TLR4, previne Alzheimer/Parkinson).
- Fix cohort (eco lexical): `cohortProvider` parou de fazer substring de palavras da query em `notes`. Agora detecta entidade canônica (raça via `pet_profiles.breed`, condição via `pet_conditions.condition_name`) presente no texto da pergunta e filtra a contagem real. Sem entidade reconhecida → claim explícito ("sem entidade clínica reconhecida"), nunca eco da query.
_files: src/services/multi-source-resolver.ts, src/components/clinical/MechanismDiagram.tsx, src/components/clinical/SourcePanel.tsx, src/i18n.ts_

### 2026-06-09 · [curation] FIXED — Ingestão: gate qualitativo + truncamento relativo + Call 1 dedicada
- Root cause: chamada monolítica do `gemini-file-search` competia `full_text` com 22 outras propriedades clínicas no mesmo tool call (`gemini-3-pro-preview`), causando truncamento progressivo do texto completo e queda na análise — sintoma do estudo Spermine (09/06) com `analysis_data` zerado mas `kanban_status='processed'`, e do CoQ10 (22/05) caindo no fallback `structured_data_enhanced` com 0 nutracêuticos.
- Fix estrutural — split em 2 calls no `gemini-file-search`: nova função `acquireFullText()` (Call 1, `gemini-2.5-flash`, schema minimal `{ full_text: string }`) roda em paralelo conceitual e sobrescreve `extractedData.full_text` quando entrega texto maior; a Call 2 existente (`extractWithFileSearch`) preserva as 22 propriedades clínicas. Metadados bibliográficos seguem propriedade exclusiva do `parse-study` (Call 1 nunca grava em title/authors/year/abstract/doi).
- Gate de 3 estados (qualitativo, SEM char-floor absoluto) persistido em nova coluna `processed_studies.ingestion_stages jsonb`:
_files: supabase/functions/parse-study/index.ts, supabase/functions/gemini-file-search/index.ts, supabase/functions/extract-study-entities/index.ts, supabase/functions/vectorize-study/index.ts…_

### 2026-06-08 · [admin] FIXED — Auditorias: tag CONFIDENCIAL sem encavalamento + propriedade PetMoreTime reforçada
- `audit-pdf-generator.ts`: banner CONFIDENCIAL agora usa layout flex real (tag em `<span>` com `flex-shrink:0`), eliminando a sobreposição do pseudo-elemento `::before` sobre o texto observada em PT/EN.
- Footer discreto fixado em todas as páginas no `@media print` (`position:fixed; bottom:0`, 9px italic, "CONFIDENCIAL" em vermelho sóbrio inline), mantendo aparição única em tela.
- Copy do banner e do rodapé reforçam propriedade exclusiva: "Plataforma Senex AI · Engine Senex AI v7 · © PetMoreTime. Todos os direitos reservados. Tecnologia, modelos e conteúdo são propriedade exclusiva da PetMoreTime." (PT/EN equivalentes). Vale para os relatórios técnicos e showcase, tanto em download quanto em print.
_files: src/components/administrador/audits/audit-pdf-generator.ts_

### 2026-06-08 · [admin] CHANGED — Pilares científicos: TxGNN e Hetionet adicionados como PARTIAL
- AboutSenexTab: incluídos TxGNN (Huang 2024, Nature Medicine) e Hetionet/DWPC (Himmelstein 2017, eLife) no card "Pilares científicos (inspiração × implementação)" com status `PARTIAL`, refletindo `core_rule_evidence` já existente: TxGNN → RC-001 (doc-only), RC-008 e RC-013 (ativas); Hetionet → RC-008 e RC-014 (ativas). Inspirações ainda fora de runtime (zero-shot via metric learning + GraphMask; DWPC + permutação de rede) explicitadas.
- Diagrama do engine: nota em `O3` (Recommendation engine) marca TxGNN zero-shot + Hetionet DWPC como inspirações não-runtime. Banner de "Honestidade arquitetural" amplia a lista de inspirações/planejado.
- Esclarecimento: a lista de Pilares não é gerada por LLM — é um array TypeScript curado em `AboutSenexTab.tsx`. A fonte dinâmica papel↔RC continua sendo `core_rule_evidence` (consumida pela aba Fundamentos Arquiteturais).
_files: src/components/administrador/AboutSenexTab.tsx_

### 2026-06-08 · [admin] FIXED — Fundamentos Arquiteturais 100% bilíngue (UI + DB)
- Adicionadas todas as 150+ chaves `fundamentos.*` em PT e EN (`FundamentosTab`, `MetaKgRoadmapCard`, `MetaStudyDetailedCard`, `CoreRuleHistory`, `MetaStudyKanban`, `IngestaoMetaEstudo`): tabs, badges, roadmap (Fase A/B/C, gatilhos), confiabilidade (5 dimensões + descrições), filtros do histórico (placeholder, stances, ações, refresh), painel de ingestão (estágios, seções de lições, botões de stance promote/attach/discard/resolve_keep, toasts).
- DB `core_rules`: preenchido `justification_en` para RC-001/002/003 e `application_en` para as 18 regras; `FundamentosTab` agora consome `application_en` quando lang=en.
- Auditoria dos 6 papers arquiteturais (TxGNN, Geroscience-Dogs, KGARevion, MedGraphRAG, OptimusKG, Hetionet) — cobertura RC documentada no `.lovable/plan.md` deste turno; nenhum vínculo de evidência foi alterado.
_files: .lovable/plan.md, src/i18n.ts, src/pages/administrador/FundamentosTab.tsx_

### 2026-06-08 · [admin] CHANGED — Pilares científicos: KGARevion reclassificado de Inspiração → Parcial
- No card "Pilares científicos (inspiração × implementação)" em About-Senex, KGARevion passa de `INSPIRATION` para `PARTIAL`, refletindo o que já está vinculado em `core_rule_evidence`: RC-014 (Normalização de Predicados via Dicionário, w=0.90) e RC-008 (Taxonomia Padrão SNOMED-CT VetSCT + UMLS, w=0.95) — ambas ativas em runtime. O ciclo GRRA completo (Review + Revise independentes) segue rotulado como inspiração não implementada. Sem mudança no banco; ajuste de copy para alinhar com a aba Fundamentos Arquiteturais.
- Files: src/components/administrador/AboutSenexTab.tsx
_files: src/components/administrador/AboutSenexTab.tsx_

### 2026-06-08 · [admin] ADDED — Showcase Mode (documento paralelo para parceiro)
- Novo botão "Gerar showcase para parceiro" na aba Auditorias Técnicas. Lê o MESMO snapshot factual da auditoria (counts, kg_storage, clinical_data_provenance) e escreve 6 seções comerciais curadas (Visão, Por que importa, Diferenciais, Visão maior, Credibilidade, Parceria).
- Honestidade preservada: capacidades em presente, resultado de sinistralidade prospectivo; split R/D/S obrigatório; RC-001/002 (evidência negativa) destacada como diferencial; GRRA/U-Retrieval/TransE rotulados como inspiração.
- Roteamento: §1/4/6 Pro→Flash (define tom); §2/3/5 Flash→Pro→gpt-5-mini.
_files: supabase/functions/generate-showcase/index.ts, src/components/administrador/audits/TechnicalAuditsTab.tsx_

### 2026-06-08 · [admin] ADDED — Download de auditoria respeita idioma do header
- O seletor PT/EN do header agora controla o idioma padrão dos botões Ver / HTML / PDF nos cards e no viewer de auditoria. Antes a versão baixada sempre era PT.
- Files: src/components/administrador/audits/TechnicalAuditsTab.tsx, src/components/administrador/audits/audit-pdf-generator.ts
_files: src/components/administrador/audits/TechnicalAuditsTab.tsx, src/components/administrador/audits/audit-pdf-generator.ts_

### 2026-06-08 · [meta] FIXED — Auditoria v7.1.3: refinos de honestidade
- Ajustes no `generate-audit` sobre fatiamento de blocos (fatos-âncora de honestidade replicados em todo bloco que toca dados/coortes/KG/recomendação/compliance/twin) e contexto amplo no sumário executivo.
- Files: supabase/functions/generate-audit/index.ts
_files: supabase/functions/generate-audit/index.ts_

### 2026-06-06 · [meta] CHANGED — Auditoria v7.2.0: split clínico no snapshot + KG honesto + Gompertz erradicado
- `generate-audit/readAuditContext` — `tableNames` corrigido: `pets`→removido, `studies`→`processed_studies`, `medical_knowledge_graph` removido (legado). As 5 tabelas de população clínica (`pet_profiles`, `pet_exams`, `pet_consultations`, `pet_medications`, `pet_conditions`) saíram de `counts` de propósito — agora a ÚNICA fonte de verdade é `clinical_data_provenance` com `{real, demo, synthetic_cohort}`. Sem total bruto, o LLM não consegue mais apresentar "1234 exames processados" como atividade real.
- Novo `snapshot.kg_storage` — expõe top relacionamentos de `hierarchical_edges` (TREATS / PREVENTS / HAS_MECHANISM / ...), confirmando que os 38k+ edges são relações clínicas curadas e NÃO taxonomia legada. Inclui `triplet_extractions_approved` e `triplet_extractions_synced_to_neo4j` para reportar honestamente o espelho Neo4j.
- `audit_base_system_{pt,en}` — (1) contrato positivo: toda contagem clínica DEVE ser escrita inline como "N total (R real / D demo / S sintético)" — blacklist léxica reduzida a backstop fraco (RWD / "base de pacientes reais"); (2) Gompertz erradicado: "Gompertz NÃO está implementado em lugar nenhum, NÃO existe `breed_aging_curves`, sigmoide é o único motor"; (3) `medical_knowledge_graph` proibido como armazenamento ativo; (4) drift-guard tem renderização obrigatória mesmo com erro.
_files: supabase/functions/generate-audit/index.ts, supabase/functions/_shared/system-prompts.ts, src/data/audit-coverage.ts_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.