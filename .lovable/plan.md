## Reforma do Observatório Clínico (Clinical Monitoring v2.1)

Cinco eixos de melhoria para sair do aspecto "amador" e aproximar do nível de produção, mantendo dados 100% sintéticos rotulados.

---

### a) Números realistas (não mais redondos)

Hoje: `10.000 / 16.000 / 10.000` — visivelmente arbitrário.

Novo:
- **Tratados:** `8.473` (fração levemente irregular, ainda na casa dos 10k).
- **Cohort-espelho:** `13.916` (≠ múltiplo perfeito).
- **Gêmeos Digitais:** mesmo `#` de Tratados → `8.473` (1 twin por tratado, conforme regra).
- KPIs derivados (ROE, anos ganhos, médias) recalculados automaticamente — não há números mágicos no UI.
- Geração no `syntheticCohort.ts`: trocar constantes `TREATED=10000 / MIRROR=16000 / TWIN=10000` por `TREATED=8473 / MIRROR=13916 / TWIN=TREATED`. PRNG já garante variação realista.

---

### b) Model Feedback Loop ↔ DL Predictive Models

Hoje: KPIs "soltos" (87.4% accuracy, 42 gap-fill) sem ligação ao módulo de Modelos Preditivos.

Novo (`ModelFeedbackLoop.tsx`):
- Importar `useTranslatedPredictiveModels()` (mesma fonte que a aba Deep Learning).
- Tabela "Models receiving signal" listando os 4 modelos (`PetLove Nutra`, `CuBe`, `Trat`, `Prev`) com:
  - Accuracy atual (do módulo real)
  - **Drift observado** (calculado da cohort sintética por condição, agregado por área do modelo)
  - **Delta de aprendizado mensal** vinculado ao `monthlyGrowthRate` de cada modelo
  - Botão "Ver evolução" → navega para `/administrador?tab=modelos-preditivos`
- Card "Sinais enviados nos últimos 30d" com breakdown: novos triplets KG, ajustes de peso por modelo, gap-fills disparados.

---

### c) Adoption/Adherence — funil mensal empilhado

Hoje: barras 0-3m / 3-6m / … só com "count" total (12-18m maior que 0-3m, contraintuitivo).

Novo (`CohortObservatory.tsx` → novo componente `AdherenceMonthlyStack.tsx`):
- Eixo X: **meses 0 → 24** (resolução mensal real).
- Stacked `BarChart` por mês com 3 séries:
  - **Ativos residuais** (continuam no protocolo) — primary
  - **Novas adesões** no mês — emerald
  - **Desistências/churn** no mês — destructive (com sinal negativo abaixo do eixo, para leitura clara)
- Tooltip mostra retenção acumulada % e razão de churn (ex. "efeito-platô percebido").
- Gerador: adicionar `monthlyFlow: { active, joined, churned }[]` por pet → agregado deterministicamente no util.

---

### d) Filtros globais + densificação de dados

Hoje: cada aba consome a cohort inteira; nenhum filtro.

Novo:
- **Barra de filtros** no topo da `ClinicalMonitoringTab` (sticky), com Shadcn `Select`/`Combobox`:
  - Condição (8 opções)
  - Raça (top 15)
  - Faixa etária (Sênior 7-10 / Geriátrico 10+ / Adulto)
  - Região (5)
  - Adesão (Alta ≥80% / Média 50-79% / Baixa <50%)
  - Janela de protocolo (0-6m, 6-12m, 12-24m)
  - Botões: **Aplicar / Limpar / Salvar visão**
- `useFilteredCohort(filters)` hook → memoiza filtragem; KPIs, charts, explorer e drawer todos reagem.
- Novas métricas para tirar a sensação de "superfície":
  - **NNT sintético** (number needed to treat) por condição
  - **Time-to-response mediano** com IQR
  - **Hazard ratio simulado** treated vs mirror
  - **Faixa de confiança 95%** nas trajetórias (banda Area no `LongitudinalTrajectories`)
- Patient Explorer ganha colunas: `responseStatus`, `monthsOnProtocol`, `adherencePct`, `ROE` + ordenação por coluna.

---

### f) Caminhos biológicos mocados

Nova aba **"Pathways"** (6ª tab) ou seção dentro de Discovery Signals — **decidido: nova tab**, mais visível e fácil de evoluir.

Componente `BiologicalPathways.tsx`:
- Para cada condição (selector), renderizar um diagrama dirigido **SVG nativo** (sem libs novas) representando:
  - Nó **Composto** (esquerda) → **Mecanismo molecular** (mTOR, NRF2, AMPK, NF-κB, SIRT1, telomerase…) → **Processo celular** (autofagia, inflamação, estresse oxidativo) → **Outcome clínico** (mobilidade, função renal, cognição).
  - Setas com notação biomédica padrão da memória do projeto (`→` ativa, `⊣` inibe, `⇢` modula).
  - Largura da seta proporcional ao "n de evidência sintética" da cohort.
- Hover no nó: tooltip com `n pets tratados que tocam este caminho`, `Δ severidade médio`, `meta-studies relacionados` (link para tab Fundamentos).
- Banner amarelo "Mapa biológico simulado — gerado a partir da cohort sintética + estudos curados".
- Dados: novo arquivo `src/data/biologicalPathways.ts` com 8 caminhos bilíngue (PT/EN), referenciando IDs reais dos `SYNTHETIC_CONDITIONS` e estudos da tabela `meta_studies`.

---

### Arquivos afetados

```text
src/utils/syntheticCohort.ts                 (números + monthlyFlow + helpers)
src/hooks/useFilteredCohort.ts               (novo)
src/data/biologicalPathways.ts               (novo, bilíngue)
src/components/administrador/clinical-monitoring/
  ClinicalMonitoringTab.tsx                  (filtros sticky + nova tab)
  ClinicalFiltersBar.tsx                     (novo)
  CohortObservatory.tsx                      (novas métricas, NNT/HR/CI)
  AdherenceMonthlyStack.tsx                  (novo — substitui adoptionFunnel)
  LongitudinalTrajectories.tsx               (banda CI 95%)
  PatientExplorer.tsx                        (colunas + sort)
  ModelFeedbackLoop.tsx                      (integração com DL models)
  BiologicalPathways.tsx                     (novo)
  SyntheticDataBadge.tsx                     (números atualizados)
src/locales/{pt,en}/translation.json         (+ ~60 chaves novas)
src/i18n.ts                                  (I18N_VERSION → 1.103.0)
CHANGELOG.md + projectChangelog.generated.ts (sync)
```

---

### Notas técnicas

- Sem novas dependências (Recharts já cobre stacked + Area; SVG nativo para pathways).
- Tudo continua determinístico via `mulberry32` (mesmo seed = mesma cohort).
- `is_synthetic: true` mantido em todos os registros; badge sempre visível.
- Filtros não tocam o gerador — só `useMemo` por cima da cohort base.
- Integração com Modelos Preditivos é leitura-only (sem mutar `predictiveModelsData`).
- I18n: incrementar versão e adicionar TODAS as chaves em PT+EN simultaneamente (regra do projeto).
- CHANGELOG.md → entrada `[Unreleased] Changed: Clinical Monitoring v2.1` + `npm run sync:changelog`.

Estimativa: ~3h. Tudo dentro de `clinical-monitoring/` — sem impacto em outras telas.
