
# Evolução do Relatório do Tutor — Plano em Sprints com Testes

## Decisões consolidadas
- **Gráfico de progressão:** opção (b) — manter, mas **trocar a heurística sigmoide ad-hoc por curvas calibradas em literatura real** (ver Sprint 1) + selo de transparência + banda de confiança honesta.
- **Cadência:** sprints atômicos (1 entrega por vez), cada um termina com **suíte de testes automatizada** (Vitest) que roda no harness após o merge.
- **PDF:** `@react-pdf/renderer` (mais bonito, paginação A4 nativa, fontes embutidas, cabeçalho/rodapé, sumário, anexo de referências em Vancouver).

---

## (a) Base científica para a curva de progressão — o que existe

A pesquisa retornou material **suficiente para ancorar a projeção** em vez de inventá-la. Achados centrais:

1. **Barbeau-Grégoire et al. 2022** (Int J Mol Sci, PMC9499673) — meta-análise de 23 RCTs em OA canina/felina com nutracêuticos e dietas enriquecidas. Reporta **effect sizes (SMD)** para ômega-3, condroitina+glucosamina, mexilhão verde (PCSO-524), curcumina, colágeno não-desnaturado, em janelas de **30/60/90 dias**.
2. **Mata & Dormer 2023** (Vet Arhiv 93) — meta-análise de case-control com nutracêuticos em OA canina; quantifica magnitude e tempo até efeito mensurável.
3. **Frontiers Vet Sci 2023** (Roush-style trial, glucosamine+chondroitin vs PCSO-524 vs carprofeno) — curva de força de pico vertical mês a mês até 90 dias.
4. **PLOS One 2024** — pentosan polysulfate em OA canina, **dados longitudinais até 26 semanas** (prova de durabilidade do efeito).
5. **Enflicoxib RCT 2024** (Frontiers Vet Sci) — RCT longo, dá curva de **declínio sem tratamento** (placebo) por 12 meses, útil como contrafactual real.

→ Conclusão: dá para construir uma **tabela de parâmetros calibrados por (condição × classe de composto)** com `time_to_effect_weeks`, `peak_effect_pct`, `plateau_week`, `placebo_decline_per_year_pct`, `effect_size_SMD`, e citar 2-3 referências por célula. Onde não há literatura específica (ex.: Pulmonary Hypertension nutracêutico), o sistema mostra **"sem curva calibrada — exibindo apenas baseline"** em vez de sigmoide inventada.

---

## Arquitetura geral das sprints

Cada sprint = **1 entrega + 1 arquivo de teste**. Tamanho ~1 dia de chat.

```
Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4 → Sprint 5 → Sprint 6 → Sprint 7
 Curva     Badges     Cenário    Subgrafo   Refs       PDF        CTA
 real      KG-gap     comparado  do pet     científ.   export     dois passos
```

---

## Sprint 1 — Curva de progressão calibrada em literatura

**Objetivo:** substituir `generateProgressionData()` heurístico em `ConditionProgressionChart.tsx` por modelo paramétrico ancorado em meta-análises.

**Entregas:**
1. Nova tabela `condition_response_curves` (Supabase) com colunas:
   `condition_canonical`, `compound_class`, `time_to_effect_weeks`, `peak_effect_pct`, `plateau_week`, `placebo_decline_pct_per_year`, `effect_size_smd`, `confidence_band_pct`, `citations` (jsonb: array de PubMed IDs + DOI).
2. Seed inicial com **5 condições ancoradas** extraídas dos 5 papers acima:
   - Osteoarthritis × ômega-3
   - Osteoarthritis × glucosamina+condroitina
   - Osteoarthritis × PCSO-524 (mexilhão verde)
   - Osteoarthritis × curcumina
   - Cellular Senescence × NMN/NR (usando literatura humana extrapolada — claramente marcada como `extrapolated_from_human=true`).
3. Função `buildCalibratedCurve(condition, compounds, baseline)` em `src/services/condition-progression-engine.ts` que:
   - Busca a melhor (condição × composto) na tabela.
   - Retorna `{ withTreatment[13], withoutTreatment[13], upperBand[13], lowerBand[13], citations[], calibrated: true|false }`.
   - Se nada bater: retorna `calibrated: false` e o componente mostra apenas baseline + aviso "sem curva calibrada".
4. `ConditionProgressionChart` passa a renderizar `calibrated`/`extrapolated`/`uncalibrated` com selos visuais distintos e tooltip com as citações.

**Testes (Vitest) — `src/services/__tests__/condition-progression-engine.test.ts`:**
- Curva calibrada de OA + ômega-3 atinge plateau na semana ~12 (±2).
- Banda de confiança M0 mais estreita que M12 (ou vice-versa, conforme decidirmos).
- `withoutTreatment` decai monotonicamente quando `placebo_decline_pct_per_year > 0`.
- Caso `compound_class` desconhecida → retorna `calibrated: false` e arrays só com baseline.
- Citações nunca vazias quando `calibrated: true`.

---

## Sprint 2 — Badges KG-covered / KG-gap + transparência

**Entregas:**
- Nas seções "Condições" e no topo de cada curva: badge **KG-covered** (verde) ou **KG-gap** (âmbar) usando `coverage_by_condition` que já vem do `usePetTrajectoryProjection`.
- Tooltip explica em PT/EN o que significa cada selo.
- Adicionar selo geral no header do card: "X de Y condições com cobertura científica direta".

**Testes — `src/components/tutor/__tests__/TreatmentProposalCard.coverage.test.tsx`:**
- Render com 3 condições (2 covered, 1 gap) → badge geral mostra "2 de 3".
- Tooltip de KG-gap renderiza copy correto.
- Sem `coverage_by_condition` → não quebra (fallback silencioso).

---

## Sprint 3 — Cenário comparado "Com vs Sem protocolo" (Digital Twin real)

**Entregas:**
- Nova seção entre "Condições" e "Pathways":
  ```
  ┌──────────────────────────┬──────────────────────────┐
  │   Sem o protocolo        │   Com o protocolo        │
  │   Idade biológica +X     │   Idade biológica +Y     │
  │   Expectativa: A anos    │   Expectativa: B anos    │
  │   ↓ qualidade de vida    │   ↑ qualidade de vida    │
  └──────────────────────────┴──────────────────────────┘
            Anos ganhados: B - A  (IC: ±0.4)
  ```
- Dados 100% do `years_with_protocol` / `years_without_protocol` da edge function (que já existe).
- Badge `source: ai_kg_grounded` ou `heuristic_fallback` honesto.

**Testes:** snapshot do componente `ScenarioComparison` com 3 fixtures (grounded, fallback, sem dados).

---

## Sprint 4 — Subgrafo do pet (`PetKnowledgeSubgraph`)

**Entregas:**
- Componente 2D leve (`react-force-graph-2d`) centrado no pet → condições → compostos → outcomes.
- Cores e setas seguindo Biological Legend Standard.
- Versão SVG estática gerada no client e armazenada para uso no PDF (Sprint 6).
- Click em nó abre detalhe lateral.

**Testes:** smoke test (renderiza ≥1 nó central + N condições + M compostos a partir de fixture de proposta).

---

## Sprint 5 — Biblioteca de referências científicas

**Entregas:**
- Nova seção "Evidência Científica" com lista expandível de estudos (PMID, título, ano, journal, tipo, força).
- Filtro por composto/condição.
- Citações inline `[12]` ao lado dos triplets-chave e das curvas.
- Fonte: JOIN de `study_embeddings` com triplets da proposta.

**Testes:** `references-builder.test.ts` — agrupamento, ordenação Vancouver, deduplicação por PMID.

---

## Sprint 6 — Exportação PDF (`@react-pdf/renderer`)

**Entregas:**
- Nova função no client `exportProposalToPdf(proposal)` usando `@react-pdf/renderer`.
- Estrutura A4: capa → sumário → resumo executivo → cenário comparado → curvas (PNG capturado dos charts via `recharts`+`html-to-image`) → subgrafo (SVG embutido) → compostos → cronograma → referências Vancouver com PMIDs clicáveis → rodapé com selo de geração e data.
- Botão "Baixar PDF" no card.

**Testes:** `pdf-export.test.ts` — gera PDF a partir de fixture, parseia com `pdf-parse` e valida que contém: nome do pet, ≥3 condições, ≥1 PMID, ≥1 citação `[N]`, número correto de páginas.

---

## Sprint 7 — CTA honesto em dois passos + ROI

**Entregas:**
- CTA primário: "Iniciar com a primeira caixa — R$ X" (compromisso pequeno).
- CTA secundário: "Continuar plano anual após reavaliação no M3".
- Bloco de comparação de custo: "Plano: R$ X • Tratar [condição] instalada: R$ Y (fonte) • Diferença projetada: R$ Z".
- Promessa testável de M3: "se exames de calibração não mostrarem ≥X% de melhora, R$ Y de crédito".

**Testes:** snapshot dos dois estados de CTA + cálculo de ROI.

---

## Padrão de QA por sprint (automático)

A cada sprint:
1. Implementação da feature.
2. Arquivo `*.test.ts(x)` correspondente cobrindo casos felizes + bordas.
3. Eu rodo `bunx vitest run <arquivo>` e reporto resultado.
4. Atualização `CHANGELOG.md` + `I18N_VERSION` quando há strings novas.
5. Para sprints visuais (3, 4, 6) eu também faço screenshot do preview e inspeciono.

---

## Detalhes técnicos transversais

- **Migration Sprint 1:** uma única migration cria `condition_response_curves` + RLS pública de leitura + seed.
- **i18n:** novos namespaces `tutor.proposal.calibration.*`, `tutor.proposal.coverage.*`, `tutor.proposal.scenario.*`, `tutor.proposal.references.*`, `tutor.proposal.cta.*`.
- **Deps novas:** `@react-pdf/renderer` (Sprint 6), `react-force-graph-2d` (Sprint 4 — provavelmente já presente), `html-to-image` (Sprint 6), `pdf-parse` (devDep, Sprint 6 testes).
- **Política No-Mock:** seed de `condition_response_curves` é **literatura real com PMIDs**, não números chutados.

---

## Pergunta única antes de começar a codar

**Posso começar pelo Sprint 1 agora** (migration `condition_response_curves` + seed das 5 curvas com PMIDs reais + refator do `ConditionProgressionChart` + suíte de testes)? Se sim, sigo direto.
