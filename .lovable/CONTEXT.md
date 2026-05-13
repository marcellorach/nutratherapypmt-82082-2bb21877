# Project context briefing (auto)
Generated: 2026-05-13T12:39:15.454Z

Read this file BEFORE starting any non-trivial task. It is the project's working memory.

## Latest i18n version: 1.74.5

## Changes by area (last 14 days)
- **vet-ui**: 18
- **admin**: 11
- **tutor-ui**: 7
- **clinical-pipeline**: 6
- **kg**: 6
- **i18n**: 3
- **curation**: 3
- **meta**: 2
- **infra**: 2

## Top 10 recent entries
### 2026-05-13 · [vet-ui] ADDED — Digital Twin do paciente (Fase 2 — histórico, traits, labs)
- `PatientKnowledgeSubgraph` ganha 3 novas camadas opcionais conectadas ao nó Pet central:
- Diagnósticos passados (círculos cinza, aresta `HAS_HISTORY` tracejada) lidos de `pet_conditions` resolvidas + consultas anteriores em `pet_consultations`.
- Traits (hexágonos azul-claro, aresta `HAS_TRAIT`) representando raça, faixa etária (filhote/adulto/sênior/geriátrico) e sexo. Traits de raça desenham `BREED_RISK_FOR` (tracejada azul-escura) apontando para condições predispostas vindas de `BreedPredisposition`.
_files: src/components/pet/PatientKnowledgeSubgraph.tsx, src/pages/veterinario/PetProfilePage.tsx, src/i18n.ts_

### 2026-05-13 · [vet-ui] ADDED — Subgrafo do paciente vira Digital Twin (Fase 1)
- `PatientKnowledgeSubgraph` agora renderiza um nó Pet central (estrela azul) com tooltip de raça/idade/peso/sexo, conectando-se via `HAS_CONDITION` a todas as condições ativas — antes condições e compostos flutuavam soltos sem dono clínico.
- Novos tipos de nó: medicação ativa (caixa roxa, lida de `pet_medications`) ligada ao Pet por `TAKES`, e detratores geriátricos ocultos (diamante âmbar) ligados por `EXHIBITS_DETRACTOR`.
- Novo tipo de aresta `INTERACTS_WITH` (vermelha, bidirecional) desenhada automaticamente entre composto recomendado e medicação atual sempre que o pipeline detecta um `InteractionAlert` — vet vê o conflito antes de aprovar.
_files: src/components/pet/PatientKnowledgeSubgraph.tsx, src/components/pet/VetGraphRAGInsightsPanel.tsx, src/pages/veterinario/PetProfilePage.tsx, src/i18n.ts_

### 2026-05-13 · [vet-ui] CHANGED — Evidências sempre com 2-3 links de estudos
- "Ver evidências e contexto" agora garante 2-3 referências clicáveis por composto, mesmo quando não há estudo curado para o par (composto × condição) — antes a seção "Estudos científicos" simplesmente sumia.
- Pipeline (`clinical-analysis-pipeline.ts → attachStudiesToCompounds`): novo helper `buildPublicSearchStudies(compound, condition)` que monta links determinísticos PubMed + Google Scholar; usado para top-up até `MAX_STUDIES_PER_COMPOUND = 3` quando o conjunto curado tem < 2 itens, e como fallback final no catch.
- UI (`CompoundDosageSlider.tsx`): novo badge "Busca pública" (cinza) diferenciando-o de PubMed/DOI/Scholar curados — mantém transparência do No-Mock Policy: nada é simulado, são buscas reais rotuladas.
_files: src/services/clinical-analysis-pipeline.ts, src/components/pet/CompoundDosageSlider.tsx, src/locales/pt/translation.json, src/locales/en/translation.json…_

### 2026-05-13 · [vet-ui] CHANGED — Detratores Geriátricos Ocultos: separação rigorosa de gerociência vs. clínica
- Renomeada seção "Comorbidades Ocultas (Gerociência)" → "Detratores Geriátricos Ocultos" (PT) / "Hidden Geriatric Detractors" (EN). Reforça que o que aparece ali são processos moleculares de envelhecimento (senescência celular, inflammaging, estresse oxidativo, disfunção mitocondrial), não diagnósticos clínicos.
- `VetGraphRAGInsightsPanel`: rótulos de gerociência (`Cellular Senescence`, `Inflammaging`, `Oxidative Stress`, `Mitochondrial Dysfunction`) nunca mais aparecem em "Condições Clínicas Atuais Confirmadas" — são sempre redirigidos para detratores ocultos, mesmo se vierem registrados em `pet_conditions` (legado).
- Nova heurística `inferGeroscienceTriggers()`: dispara detrator oculto a partir de portas de entrada clínicas e idade (≥7a) — Osteoartrite/displasia/sarcopenia → Senescência Celular; Inflamação crônica/obesidade/OA → Inflammaging; DRC/MMVD/CDS → Estresse Oxidativo; CDS/mielopatia/sarcopenia → Disfunção Mitocondrial. Garante que o painel não fica em "0" mesmo quando o KG ainda não tem triplets.
_files: src/components/pet/VetGraphRAGInsightsPanel.tsx, src/components/pet/GenerateSamplePetsButton.tsx, src/locales/pt/translation.json, src/locales/en/translation.json…_

### 2026-05-13 · [vet-ui] CHANGED — Diferenciação de vozes na consulta: vet livre vs. interpretação rica da IA
- Reescritos todos os campos `assessment` das 15 consultas de demo (`SAMPLE_PETS`) com texto livre/coloquial em primeira pessoa do veterinário; em ~1 a cada 3 consultas, uma das condições é propositalmente omitida do texto (mas mantida em `conditions[]`) para demonstrar valor da camada Senex AI.
- Substituída a geração trivial de `machine_summary` (antes: primeira frase do assessment) por nova função `buildMachineSummary()` que sintetiza queixa + exame físico + achados laboratoriais (com `flags_abnormal` e `interpretation`) + condições canônicas completas + medicações + plano. Resultado renderizado no callout amarelo "Interpretação automática desta consulta".
- Reforço da proposta de valor: o texto livre do vet pode esquecer um diagnóstico — a interpretação automática (Senex AI · PetMoreTime) sempre cobre todas as condições registradas via base de conhecimento.
_files: src/components/pet/GenerateSamplePetsButton.tsx_

### 2026-05-13 · [meta] CHANGED — Reforço de marca: Senex AI · © PetMoreTime · 2025–presente
- Adicionada linha de assinatura de marca nos headers das tabs administrativas: Organograma, Auditorias Técnicas e Conformidade FDA/EMA/AVMA, deixando explícito que Senex AI é o motor proprietário desenvolvido e operado exclusivamente pela PetMoreTime (2025–presente), sucessor da arquitetura interna VetGraphRAG/VetMedGraph.
- Documentação técnica (`docs/TECHNICAL_DECISIONS.md`, `ARCHITECTURE.md`) recebeu nota de autoria/operação no header.
- Knowledge File do projeto (project memory) atualizado com nova entrada `mem://branding/senex-ai-rename` consolidando: marca pública = Senex AI, autoria/operação exclusiva = PetMoreTime, identificadores internos preservados.
_files: src/pages/administrador/OrganogramaTab.tsx, src/components/administrador/audits/TechnicalAuditsTab.tsx, src/components/administrador/compliance/ComplianceDashboard.tsx, src/i18n.ts_

### 2026-05-13 · [meta] CHANGED — Rebrand: motor "VetGraphRAG" passa a se chamar "Senex AI" na camada visível
- Substituição em massa da marca exposta ao usuário: "VetGraphRAG" → Senex AI em todas as traduções (PT/EN, 27 ocorrências cada), strings JSX, descrições de tabs administrativas, organograma, taxonomia biomédica, exports de PDF e relatórios de confiança.
- Identificadores internos preservados intencionalmente: tipos (`VetGraphRAGAnalysisResult`, `VetGraphRAGConditionTag`), hooks (`useVetGraphRAGConfig`, `useVetGraphRAGLogs`, `useVetGraphRAGQueue`, `useNtaiProcessing`), componentes (`VetGraphRAGInsightsPanel`), arquivos (`vetgraphrag-service.ts`, `vetgraphrag.ts`), edge functions e colunas de DB. Evita refactor estrutural.
- I18N bumped para `1.74.0` para invalidar cache de traduções.
_files: .lovable/plan.md_

### 2026-05-12 · [vet-ui] CHANGED — Card de consulta: separa exame físico vs complementares, renomeia avaliação e adiciona quadro amarelo de interpretação automática
- Achados de "Neurological/Orthopedic/Cardiovascular Examination" gravados em `pet_exams` deixam de poluir a tabela de Exames Complementares e passam a ser fundidos em `physical_exam.specific.<área>` no `PhysicalExamBlock`. Lógica em novo `src/services/exam-classification.ts` (`partitionExams`, `mergePhysicalExamRows`).
- Tabela "Exames Complementares" agora mostra estado vazio explícito quando não há sangue/imagem/urina na consulta.
- Bloco "Avaliação" renomeado para "Suspeita / Diagnóstico" (`petTimeline.assessmentTitle`) e "Conduta" para "Plano / Conduta" (`petTimeline.planTitle`). Texto cru do veterinário permanece intacto.
_files: src/services/exam-classification.ts, src/components/pet/AssessmentInterpretation.tsx, src/components/pet/ConsultationMachineSummary.tsx, src/components/pet/PetConsultationsTimeline.tsx…_

### 2026-05-12 · [vet-ui] ADDED — Reestrutura da consulta clínica + agrupamento gerociência + remoção da aba Notas
- Aba Notas Clínicas removida do `PetProfilePage` (notas continuam visíveis dentro de cada consulta no histórico). Card "0 Notas Clínicas" mantido no topo conforme decisão do usuário.
- Lista de condições no perfil agora ordena condições tradicionais primeiro e empurra hallmarks de gerociência (inflammaging, sarcopenia, disfunção mitocondrial, senescência celular, CCD, imunossenescência etc.) para o final, marcadas como "atenção geriátrica" via `condition-classification.ts`.
- Novo serviço `src/services/condition-classification.ts` com whitelist EN/PT de hallmarks de envelhecimento e helper `geroscienceOriginLabelKey` que devolve i18n key + params (`bySuggestedExams`, `byVetVisit`, `byVetGeneric`).
_files: src/services/condition-classification.ts, src/pages/veterinario/PetProfilePage.tsx, src/components/pet/PetConsultationsTimeline.tsx, src/components/pet/PhysicalExamBlock.tsx…_

### 2026-05-12 · [vet-ui] ADDED — Análise nutricional condicional ao catálogo + nomenclatura preventivo/terapêutico + revisão técnica admin-only
- `NutritionGapAnalysis` agora suprime a tabela de gaps e a seção "Sugerido pela raça" quando a ração não está no catálogo (`pet_food_nutrition` ausente). Em vez disso, exibe um card âmbar único: "A análise de complementação nutricional não foi concluída porque esta ração ainda não está no nosso banco de dados."
- Botões Procurar e Incorporar (restritos a admin via `useAuth().hasRole('admin')`) chamam a edge `enrich-pet-food-product`. "Incorporar" só é habilitado quando a confiança da extração ≥ 0.4. Sucesso invalida `['nutrition-gap', petId]` e a análise re-roda automaticamente.
- Edge `enrich-pet-food-product` extendida com `persist: true` + `link_to_item_id?`: cria/recupera `pet_food_brands` e `pet_food_products` (snake-insensitive), insere a composição em `pet_food_nutrition` e vincula o `pet_nutrition_items.product_id` em uma única chamada (service role).
_files: .lovable/memory/principles/preventive-vs-therapeutic-nomenclature.md, src/components/pet/NutritionGapAnalysis.tsx, src/components/ui/technical-review-section.tsx, src/hooks/usePetFoodEnrichment.ts…_

---
To add a new entry: edit CHANGELOG.md following the structured format, then run `npm run sync:changelog`.