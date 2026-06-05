# Project context briefing (auto)
Generated: 2026-06-05T16:18:50.701Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.118.3

## Changes by area (last 14 days)
- **admin**: 30
- **clinical-pipeline**: 7
- **meta**: 5
- **infra**: 5
- **kg**: 4
- **curation**: 3

## Top 10 recent entries
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

### 2026-06-03 · [meta] CHANGED — Sweep "RWD ≠ sintético" em todas as superfícies + ponteiro de circularidade (Bloco 3)
- Extensão da regra do REGISTRO DE HONESTIDADE (auto-auditoria) para TODA superfície narrativa — o claim "Real-World Data" / "dados reais de pacientes" não pode sobreviver em UI, prompts, docs nem deck.
- `src/components/administrador/ai-insights/mockInsights.ts` (insight-002): removidas as menções a "Real-world monitoring of 3,421 dogs", "large-scale real-world evidence" e `p < 0.001`. Card relabeled como `[MOCK — illustrative]`; `dataSource`, `summary`, `basedOn`, `findings`, `recommendation.impact` todos marcados explicitamente como placeholders ilustrativos. Senex NÃO observou 3.421 cães — o número era fabricação que aparecia no admin como se fosse achado real.
- `src/locales/{pt,en}/translation.json` (`investment.alreadyMarket.b2cDesc`): removido "gerando dados reais de resultados" / "real-world outcome data". Texto novo é honesto sobre o estado: "Coleta de dados longitudinais de desfecho ainda não está estruturada (sem tabela `outcome_observations` em produção)" / equivalente EN.
_files: src/components/administrador/ai-insights/mockInsights.ts, .lovable/memory/constraints/synthetic-cohort-not-rwd.md, src/locales/pt/translation.json, src/locales/en/translation.json…_

### 2026-06-03 · [meta] ADDED — Matriz LIVE v2 + ROADMAP + STATE_REAL_VS_MOCK + PROMPTS snapshot + registro de honestidade no audit_base
- `docs/generated/ARCHITECTURE_LIVE.md` regenerada (15 linhas) com correções cosméticas: abstain/tool_choice/telemetria reetiquetados como Bloco 1 (cards #3/#1/#2), não Bloco 2. O terceiro caller clínico com `tool_choice` é nomeado: `parse-pet-exam-pdf` (junto com `hybrid-recommendation` e `extract-pet-clinical-data`). Linha 7 (auto-aprovação) expõe os três sources não-reconciliados (código `≥0.85 & ≥0.50` × RC-013 `≥0.70` × ADR/CONTEXT `≥0.50`) sem escolher um. Linha 8 (Digital Twin) marca explicitamente que código É sigmoide. Linha 13 nova para RC-003 (modulador translacional ×0.7, planned/off), distinta de RC-013.
- Resumo v2: 🟢 9 · 🟡 0 · 🟠 3 · ⚪ 3 · Total 15.
- `supabase/functions/_shared/system-prompts.ts` — `audit_base_system_pt` + `_en`: injetado bloco "REGISTRO DE HONESTIDADE / HONESTY REGISTER" que (i) proíbe descrever GRRA / U-Retrieval / TransE como mecanismos do Senex; (ii) dá os nomes honestos do que roda hoje; (iii) exige proveniência por número (medido vs paper); (iv) força exposição do conflito de threshold; (v) descreve fallback de recomendação como `source='llm_fallback' + disclaimer='no_kg_data'`; (vi) lista lacunas planned explicitamente.
_files: supabase/functions/_shared/system-prompts.ts, scripts/generate-prompts-snapshot.mjs, scripts/generate-architecture-live.mjs_

### 2026-06-02 · [admin] CHANGED — Honestidade da narrativa pública: 2ª passada (excerpts, comparison table, glossário)
- 2ª passada de honestidade em `admin-tabs-info-bilingual.ts` (estudos.*) — todas as ~15 menções restantes a GRRA / U-Retrieval / TransE como atributos do Senex foram convertidas em rótulos honestos. Papers continuam citados, mas apenas como inspiração científica, nunca como capacidade implementada.
- keyExcerpts (MedGraphRAG / KGARevion / TransE): cada quote agora abre com "Paper de inspiração: …" e termina com "O Senex AI NÃO implementa X — roda Y" + "benchmark do paper, não métrica do Senex".
- comparisonTable: coluna "Senex AI" da linha 6 (Retrieval) = "Híbrido Cypher + pgvector, sem fusão top-down/bottom-up"; linha 7 (Validação) = "Generate + scoring heurístico + auto-approve ≥ 0,50 + HITL (sem Review independente)"; linha 8 (Alucinações) = "Não medido no Senex AI" (os ~40% e ~87% rotulados como "benchmark do paper"); linha 12 (Link Prediction) = "Gap-fill via PubMed + Gemini (TransE permanece apenas inspiração)".
_files: src/data/admin-tabs-info-bilingual.ts_

### 2026-06-02 · [clinical-pipeline] CHANGED — IA Hardening Card #5c: hybrid-recommendation migrado para tool_choice (último do Card #5)
- Migração #1 do Card #5 (hybrid-recommendation) — última e mais sensível: substituído free-text JSON (regex `match(/```json/)` + `JSON.parse`) por `tools: [recommend_nutraceuticals]` + `tool_choice: { type: "function", function: { name: "recommend_nutraceuticals" } }`. O parse-via-regex era o ponto mais frágil dos 3 callers; com tool_choice o `model_response_invalid` deve cair próximo de zero.
- Schema único cobre ambos os modos (enrich / fallback): `nutraceuticals[]` com `{name, dosage, mechanism, evidenceLevel('AI-enriched'|'AI-generated'), condition, targetCondition?, closes_gaps?[]}` + `rationale` + `precautions[]` + envelope `abstain/abstain_reason('clinical_signal_insufficient')/abstain_detail`. `additionalProperties:false`. System prompt orienta qual `evidenceLevel` usar por modo.
- Card #3 PRESERVADO bit-a-bit (não desfeito):
_files: supabase/functions/hybrid-recommendation/index.ts_

### 2026-06-02 · [clinical-pipeline] CHANGED — IA Hardening Card #5b: extract-pet-clinical-data migrado para tool_choice (Gateway + abstain tipado)
- Migração #2 do Card #5 (extract-pet-clinical-data): substituído `responseMimeType: 'application/json'` (Gemini direto) por `tools: [extract_clinical_entities]` + `tool_choice: { type: "function", function: { name: "extract_clinical_entities" } }` via Lovable AI Gateway. Unifica o caminho com o #3 (parse-pet-exam-pdf) já migrado — uma única autenticação (`LOVABLE_API_KEY`), uma única semântica de tool-calling.
- GUARDRAIL Card #4 preservado: o schema do tool INCLUI `abstain: boolean`, `abstain_reason` (enum), `abstain_detail`. `abstain=true` com 5 listas vazias é resposta VÁLIDA do tool, não erro de parse. Pré-flight de abstain (texto curto, key ausente) PERMANECE — agora roda ANTES da chamada ao Gateway.
- Buckets de abstain desambiguados (essencial para a verificação ANTES/DEPOIS pedida):
_files: src/types/recommendation-confidence.ts, supabase/functions/extract-pet-clinical-data/index.ts_

### 2026-06-02 · [clinical-pipeline] CHANGED — IA Hardening Card #5a: parse-pet-exam-pdf migrado para tool_choice (schema fechado)
- Migração #3 do Card #5 (parse-pet-exam-pdf): substituído `response_format: { type: "json_object" }` por tool-calling forçado (`tools: [extract_exam_data]` + `tool_choice: { type: "function", function: { name: "extract_exam_data" } }`). `json_object` garantia apenas "é JSON válido", não "tem os campos certos" — agora o schema dos analitos (analyte/value/unit/ref_min/ref_max/flag) é parte do contrato com o modelo. Risco mitigado: unidade/valor no campo errado = interpretação clínica errada (ALT em mg/dL vs U/L muda a leitura).
- Schema fechado: `results` migrou de dict `{ analyte: { ... } }` para `array [{ analyte, value, unit, ref_min, ref_max, flag }]` no contrato do modelo. `additionalProperties: false` no item. Tipos opcionais expressos como `["number","null"]` para evitar inferência ambígua. `normalizeResults` ganhou compat dupla (aceita dict legado E array novo) — nenhum exame antigo persistido quebra.
- Extração de resposta: lê de `choices[0].message.tool_calls[0].function.arguments` (forçado pelo `tool_choice`). Fallback para `message.content` mantido por defesa, mas não deve ser exercido.
_files: supabase/functions/parse-pet-exam-pdf/index.ts_

### 2026-06-02 · [clinical-pipeline] ADDED — IA Hardening Cards #3+#4: abstain válido + provenance tipada + remoção do simpleExtraction
- Card #3 (envelope abstain + carimbo de proveniência em `hybrid-recommendation`): pré-flight de abstenção dispara SOMENTE por falta de sinal de entrada (sem `condition` OU sem qualquer sinal de pet/clínico). KG vazio NUNCA aciona abstain — gera resposta marcada com `source:'llm_fallback' + disclaimer:'no_kg_data'` (preservada). Toda resposta agora carrega envelope `{ source, disclaimer, abstain }`. Branch `llm_fallback` passa a carimbar `evidenceLevel:'AI-enriched'` por composto (antes ficava sem marca de origem, abrindo brecha para tutor receber recomendação sem tarja).
- Card #4 (remoção do `simpleExtraction`): `supabase/functions/extract-pet-clinical-data/index.ts` perdeu o fallback regex rule-based que fabricava entidades silenciosamente quando a chave do modelo estava ausente, o modelo retornava erro/vazio, ou o parse JSON falhava. Todos esses caminhos agora retornam envelope abstain (`clinical_signal_insufficient`) com arrays vazios — comportamento honesto, mensurável e rastreável pela telemetria do card #2.
- Tipos centralizados (Eixo B — proveniência): novo `CompoundProvenance = 'KG-backed' | 'AI-enriched' | 'AI-generated'` e `AbstainEnvelope` em `src/types/recommendation-confidence.ts`. Valores MANTIDOS em PascalCase/kebab por compatibilidade de UI — Bloco 2(e) do plano fica responsável por normalizar para snake_case e separar value↔label (evita dois churns no mesmo campo). Eixo A (qualidade científica em `src/rules/general/evidence-levels.ts`) permanece ortogonal e intocado.
_files: supabase/functions/extract-pet-clinical-data/index.ts, src/types/recommendation-confidence.ts, src/rules/general/evidence-levels.ts, supabase/functions/hybrid-recommendation/index.ts_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.