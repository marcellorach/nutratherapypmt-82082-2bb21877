## Plano: 6 modelos preditivos + cohorts ancorados (versão ampla vs. estratificada)

### 1. Expandir de 4 para 6 modelos

Manter os 4 atuais e adicionar 2 novos. Mantemos os ids snake-case dos atuais e adicionamos:

| # | modelId | Nome | População-alvo principal |
|---|---|---|---|
| 1 | `efficacy-prediction` | Nutraceutical Efficacy Prediction | vivos + falecidos (outcome final) |
| 2 | `disease-progression` | Disease Progression Prediction | vivos longitudinais + falecidos (gold label) |
| 3 | `cost-benefit-analysis` | Cost-Benefit Analysis | vivos (custo real PetLove) |
| 4 | `patient-segmentation` | Treatability Segmentation | vivos + falecidos |
| 5 | `mortality-risk-window` *(novo)* | Mortality Risk & Intervention Window | falecidos (100%) |
| 6 | `treatment-adherence` *(novo)* | Treatment Adherence Predictor | vivos (operacional puro) |

Descartados desta rodada (anotar em CHANGELOG como "futuros"): `avoidable-death-detector`, `polypharmacy-risk-score`, `breed-specific-aging-curve` — todos podem nascer como derivados dos 6 acima depois.

### 2. Dois cohorts-âncora por modelo (12 exemplos no total)

Para cada modelo, uma versão **ampla** (N maior, padrão mais diluído, viabilidade alta) e uma **estratificada** (N menor, padrão mais nítido, impacto alto). Isso vira o seed inicial do `suggest-cohort-ideas`.

| Modelo | Cohort AMPLO | Cohort ESTRATIFICADO |
|---|---|---|
| **1. Efficacy Prediction** | Cães ≥6a em uso de condroprotetor oral ≥6m (qualquer raça >15kg) com 2+ avaliações clínicas — N alvo 1500 · vivos | Golden Retriever 6–10a, condroprotetor ≥12m, ≥3 escores funcionais (Helsinki/CBPI), sem corticoide concomitante — N 250 · vivos |
| **2. Disease Progression** | Cães com creatinina >1.6 em algum momento, ≥18m de seguimento (qualquer raça/idade) — N 2000 · vivos+falecidos | Cães falecidos por DRC nos últimos 24m, com ≥18m pré-óbito e ≥3 hemogramas/bioquímicos seriados — N 300 · falecidos |
| **3. Cost-Benefit** | Cães em qualquer plano nutracêutico contínuo ≥6m com gasto vet documentado 12m antes/depois — N 1200 · vivos | Cães com osteoartrite confirmada que alternaram entre AINE crônico e protocolo nutracêutico, com registro de visitas/exames antes e depois — N 200 · vivos |
| **4. Treatability Segmentation** | Cães ≥5a com 2+ condições crônicas ativas e ≥4 medicações simultâneas — N 1000 · vivos+falecidos | Cães com polifarmácia hepatotóxica documentada (≥3 fármacos com risco hepático) + ALT/AST seriadas — N 250 · mistos |
| **5. Mortality Risk & Window** *(novo)* | Cães falecidos nos últimos 36m com causa de óbito registrada e ≥12m de prontuário pré-óbito — N 1500 · falecidos | Cães falecidos por linfoma multicêntrico com protocolo quimioterápico completo e datas de recidiva registradas — N 150 · falecidos |
| **6. Treatment Adherence** *(novo)* | Tutores que iniciaram qualquer plano nutracêutico nos últimos 18m, com registro de recompra/renovação — N 2000 · vivos | Tutores de cães grandes (>25kg) com osteoartrite que iniciaram plano de ≥3 compostos, acompanhados por 9m com check-ins agendados — N 300 · vivos |

Cada um desses 12 entra no card com: população (🟢/⚫/⚪), `pattern_family`, `discoverable_pattern`, `value_to_partner`, `record_requirements`, e a frase âncora **"Este cohort treina: [Modelo X] → +N pets, esperado +Y% accuracy"**.

### 3. Mudanças de código (sem implementar agora — só desenhar)

**a) `src/components/administrador/modelosPreditivos/data/predictiveModelsData.ts`**
- Adicionar 2 novos modelos (`mortality-risk-window`, `treatment-adherence`) com status `initial`, `totalPetsMonitored: 0`, `dataSources` apontando para `clinical_monitoring`/`anamnesis`, `degenerativeInsights: []`.
- Marcar claramente como "aguardando primeiro cohort" (sem números mock inflados).

**b) `src/locales/{pt,en}/translation.json`** + bump `I18N_VERSION` em `src/i18n.ts`
- Novas chaves `predictiveModels.models.mortality-risk-window.{name,description,milestone}` e `predictiveModels.models.treatment-adherence.{name,description,milestone}`.

**c) `supabase/functions/suggest-cohort-ideas/index.ts`** — reescrita do system prompt e tool schema (continuação do plano anterior, agora consolidado):
- System prompt orientado a **valor PetLove** (não preenchimento de KG).
- Tool schema ganha: `cohort_population` (`living`/`deceased`/`mixed`), `pattern_family`, `value_to_partner`, `discoverable_pattern`, `record_requirements`, `target_model_id` (um dos 6 ids acima), `target_model_expected_gain` (string curta), `breadth` (`broad`/`stratified`).
- Instrução: sempre devolver 6 cohorts (1 por modelo), e o LLM pode escolher se aquele cohort específico é broad ou stratified, mas o conjunto precisa cobrir os 6 modelos.

**d) Migration** `cohort_suggestions` — colunas novas: `pattern_family text`, `value_to_partner text`, `cohort_population text check in ('living','deceased','mixed')`, `record_requirements jsonb`, `target_model_id text`, `target_model_expected_gain text`, `breadth text check in ('broad','stratified')`.

**e) `CohortAISuggester.tsx`** — card mostra:
- Header: tag população (🟢/⚫/⚪) + badge breadth (Amplo/Estratificado) + chip "Treina: [Nome do Modelo]".
- Bloco "Por que sugerimos isto": `discoverable_pattern`, `value_to_partner`, `record_requirements`.
- Rodapé: "Impacto = ganho operacional · Viabilidade = dado já existe na PetLove".

**f) `CHANGELOG.md`** — entrada em `[Unreleased]` com area `predictive-models` + `cohort-suggestions`, status `planned`, i18n `pt+en`. Rodar `npm run sync:changelog`.

**g) Organograma** — `src/data/projectOrganograma.ts`: confirmar que a aba Modelos Preditivos lista 6 modelos (não 4).

### 4. Ordem de execução proposta (já em build mode)

1. Atualizar `predictiveModelsData.ts` + traduções + bump i18n (modelos visíveis primeiro, mesmo zerados).
2. Migration `cohort_suggestions` com colunas novas.
3. Reescrever `suggest-cohort-ideas` (prompt + tool schema + persistência das colunas novas).
4. Refatorar UI do `CohortAISuggester.tsx`.
5. Seed inicial: rodar a função uma vez e validar que os 6 cohorts gerados batem com os exemplos da tabela acima (validação manual sua antes de seguir).
6. Atualizar organograma + CHANGELOG + docs.

### 5. Pontos de validação antes de eu codar

- Os 6 modelos cobrem o que você quer? Algum a tirar/trocar?
- A regra "1 cohort por modelo, mistura broad/stratified livremente" serve, ou prefere "sempre 2 por modelo = 12 cards"?
- Os exemplos amplos vs. estratificados da tabela acima fazem sentido clinicamente, ou ajusta algum recorte (idade, raça, N) antes de eu congelar como seed?