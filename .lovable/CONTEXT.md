# Project context briefing (auto)
Generated: 2026-06-08T22:56:02.784Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: —

## Changes by area (last 14 days)
- **admin**: 28
- **meta**: 8
- **clinical-pipeline**: 7
- **infra**: 5
- **kg**: 3
- **curation**: 3

## Top 10 recent entries
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

### 2026-06-06 · [meta] CHANGED — Auditoria v7.1.0: ênfases de honestidade no prompt do auditor
- `buildBaseSystem` (generate-audit) agora anexa um bloco "ÊNFASES DESTA RODADA" (PT/EN) no topo do system prompt antes do checklist, reforçando 3 correções de honestidade que o auditor v7.0.x escorregava: (1) Digital Twin = sigmóide (qualquer "Gompertz" como motor de resposta a tratamento deve ser reportado como erro doc; Gompertz só vale para `breed_aging_curves`); (2) dados clínicos exigem split real/demo/synthetic_cohort do snapshot — proibido "RWD"/"dados do mundo real" com ~98% synthetic; (3) GRRA, U-Retrieval e TransE são inspiração, não mecanismos do Senex.
- Checklist canônico (`FALLBACK_COVERAGE`) corrigido:
- `digital-twin`: título agora separa explicitamente os dois motores (sigmóide para condição × nutracêutico vs. Gompertz para envelhecimento por raça) e cita `breed_aging_curves + project-pet-trajectory` no evidence.
_files: supabase/functions/generate-audit/index.ts_

### 2026-06-05 · [admin] ADDED — Painel Preview vs Publicado na aba de Auditorias
- Novo componente `PreviewVsPublishedPanel` (admin → Auditorias) — compara em tempo real os 4 snapshots auditáveis (`drift-report.json`, `ARCHITECTURE_LIVE.md`, `CHANGELOG.md`, `PROMPTS.md`) entre o ambiente de preview (`window.location.origin`) e o publicado (`https://longevidade.ai`). Status verde/amarelo por sha-256, botão "Ver diff" abre `SnapshotDiffDialog` lado a lado (lib `diff`).
- Nova edge function `compare-snapshots` — fetch server-side paralelo dos dois ambientes (contorna CORS de hospedagem estática), whitelist fixa de arquivos, devolve `{file, equal, preview, published}` com sha-256.
- Novo passo de build `scripts/copy-snapshots-to-public.mjs` (último passo de `npm run audit:prebuild`) — copia os 4 artefatos para `public/snapshots/` + `manifest.json` com sha-256/bytes/timestamp. Sem esse passo, navegador não consegue baixar `ARCHITECTURE_LIVE.md`/`CHANGELOG.md`/`PROMPTS.md` (estão fora de `/public/`).
_files: scripts/copy-snapshots-to-public.mjs, src/components/administrador/audits/PreviewVsPublishedPanel.tsx, src/components/administrador/audits/SnapshotDiffDialog.tsx, src/components/administrador/audits/TechnicalAuditsTab.tsx…_

### 2026-06-04 · [meta] ADDED — Drift-guard A+B+C+D dobrado no pipeline da auditoria
- Novo script `scripts/drift-guard.mjs` (`npm run drift:guard`) — checagem WARN-only que compara as superfícies à mão (AboutSenexTab, CORE_RULES.md, GRAPHRAG_ARCHITECTURE.md, admin-tabs-info, landing) com a MATRIX em `generate-architecture-live.mjs`. Quatro camadas:
- A — vocabulário proibido (`GRRA`, `U-Retrieval`, `TransE`, `RWD`, "Real-World Data", "dados reais", "ingestão massiva", "base de pacientes reais") sem mitigador (`inspiração|inspiration|planned|sintético|...`) no parágrafo.
- B — ponteiros mortos: cada caminho citado em `pointer:` da MATRIX precisa existir no repo.
_files: scripts/drift-guard.mjs, public/drift-report.json, supabase/functions/generate-audit/index.ts, supabase/functions/_shared/system-prompts.ts_

### 2026-06-03 · [kg] ADDED — Bloco 2: telemetria do verificador + página admin de runs
- Migração: 4 colunas em `triplet_verifications` (`tool_choice_used`, `abstain_reason` ∈ {no_chunks, low_similarity, chunks_off_topic, verifier_error, tool_call_missing, other}, `recalled_chunks` jsonb com snippet+similaridade por chunk, `recall_similarity_top`) + `stratification_snapshot` em `triplet_verification_runs` (snapshot verdade-base de quantos itens foram sorteados por banda/enrichment/camada).
- Runner (`triplet-verification-runner`): preenche os novos campos por linha; classifica `abstain_reason` automaticamente quando o verdict é `unverifiable`; serializa chunks recuperados com snippet (320 chars) marcando quais o verificador alegou suportar a claim.
- Admin UI — nova tab `verification-runs` (grupo Base de Conhecimento, sidebar com ícone ShieldCheck): lista runs com control_specificity, drill-down por run com filtros (tipo: triplet/control · verdict · camada de controle), linha expansível mostra rationale do verificador + chunks recuperados (com badge verde nos suportados) + latência/custo/tool_choice.
_files: supabase/functions/triplet-verification-runner/index.ts, src/components/administrador/verification/VerificationRunsTab.tsx, src/components/administrador/sidebar/groups/KnowledgeBaseGroup.tsx, src/config/admin-tabs.ts…_

### 2026-06-03 · [kg] ADDED — Bloco 2 infra: verificador independente (tabelas + runner + prompt)
_status: parcial_
- Migração: 3 tabelas novas — `triplet_verification_runs` (metadata de batch), `verification_controls` (banco de controles negativos em camadas: backbone_swap, pubmed_null, realistic_cross_species, realistic_breed_general, realistic_preliminary, synthetic_floor, gold_set), `triplet_verifications` (uma linha por `{triplet|control} × run` com verdict/confidence/chunks/model/latência/custo).
- Edge function `triplet-verification-runner`: amostra estratificada (banda cinza 0.50–0.84 + alta 0.85–1.00, estratificada por `enrichment_source`); recall top-k via `search_study_chunks` (RPC) com fallback `ilike` instrumentado; verificador de família diferente (default `openai/gpt-5.4-mini`, vs. extrator Gemini); `tool_choice` forçado em `submit_verification`; persistência + sumarização (histograma de verdict, especificidade por layer).
- System prompt `triplet_verification`: abstain honesto obrigatório (chunks não tratam claim → `unverifiable`), regras de downgrade (preliminar/cross-species/breed-generalizado → `correct`), null-result phrasing → `discard`, sem rescate por conhecimento externo.
_files: supabase/functions/triplet-verification-runner/index.ts, supabase/functions/_shared/system-prompts.ts_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.