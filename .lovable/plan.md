## Contexto

Você fez 5 perguntas profundas sobre a área "Fundamentos Arquiteturais" e os popovers de scores. Antes de propor mudanças, respondo cada ponto com diagnóstico, depois consolido o plano técnico no final.

---

## 7) Por que 4.0/5 em "Qualidade Metodológica" com todos os checks ✓?

**Diagnóstico**: hoje `ScoreCriteriaPopover` mostra apenas os critérios binários (✓/✗), mas o score vem de `study_assessment.quality_score` calculado pelo LLM com pesos que **não** são 1:1 com os 7 critérios exibidos. Os pontos que "faltam" para 5/5 hoje são invisíveis ao usuário. Causas típicas do "teto 4.0":
- `sample_size` está presente mas **abaixo do limiar de boa potência estatística** (ex.: n<100 perde ~0.5).
- `follow_up_duration` curto (12 semanas perde ~0.3 vs ≥6 meses).
- Falta de **replicação independente** (não é um critério hoje).
- Risco de viés residual (industry funding, attrition rate).

**Proposta**: expandir o popover para mostrar não só ✓/✗ mas **3 colunas — Critério · Status · Peso/Penalidade**, terminando com uma linha "Saldo → 4.0/5" e um campo livre `score_rationale` (extraído pelo Stage 3 LLM) explicando em 1-2 frases o motivo do teto. Mesmo padrão para Relevância e Novidade.

---

## 1) Já temos mais Regras-Core governando o sistema?

**Sim, muitas.** Hoje só RC-001/002/003 estão materializadas, mas o `mem://index.md` lista ~50 memórias que são, na prática, RCs implícitas. Candidatas óbvias para promoção (varrendo o index):

| Candidata | Origem | Categoria |
|---|---|---|
| RC-004 — Canonical IDs (Supabase UUID, nunca elementId) | Core memory | data-integrity |
| RC-005 — Bilinguismo em todas as camadas + I18N_VERSION bump | Core memory | i18n |
| RC-006 — No-Mock Policy | Core memory | data-integrity |
| RC-007 — Curation Gatekeeper (não integra ao KG sem curar; auto-approve ≥50%) | Core memory | curation |
| RC-008 — Standard Taxonomy (SNOMED-CT VetSCT + UMLS) | Core memory | ontology |
| RC-009 — Therapeutic cap = 8 compostos sinérgicos | Core memory | clinical-recommendation |
| RC-010 — Clinical Scope: metabólico/degenerativo em caninos (exclui MRI) | Core memory | clinical-scope |
| RC-011 — Soft delete + audit (typing 'DELETE' para bulk) | Core memory | data-permanence |
| RC-012 — Vectorization é pré-requisito da curadoria | architecture memory | pipeline |
| RC-013 — Confidence-tiered governance (≥0.7 auto / <0.7 pending) | architecture memory | curation |
| RC-014 — Predicate normalization dictionary | architecture memory | extraction |
| RC-015 — Triplet chunking strategy (Gemini pro/long context) | architecture memory | extraction |
| RC-016 — Evidence projection sigmoid engine | clinical memory | recommendation |
| RC-017 — Condition canonicalization UI↔KG | clinical memory | semantics |
| RC-018 — Demo data via is_demo flag | feature memory | data-governance |

Não são "novas regras" — são regras já vigentes mas dispersas. O valor é torná-las **auditáveis e versionadas** no mesmo lugar.

---

## 2) Ingestão de estudos arquiteturais + instruções (.md) curados

**Sim, deveríamos**, mas com **separação clara de KG clínico**. Proposta:

1. **Upload** (PDF ou .md) → bucket `meta_studies_pdfs` (já existe).
2. **Pipeline assistido por AI** (edge function nova `extract-meta-study`):
   - Stage A: extrai `key_claims[]` com quote literal + página.
   - Stage B: para cada claim, AI sugere **a qual RC existente ele dá suporte/contradiz/modula** (score de afinidade semântica via embeddings sobre `core_rules.justification`).
   - Stage C: AI propõe se o estudo justifica **criar uma nova RC** ou apenas vincular evidência.
3. **Tela de curadoria** (sub-tab nova "Ingestão"): humano aprova/edita cada sugestão antes de gravar em `core_rule_evidence` ou criar `core_rules`.
4. **Instruções.md curadas**: tabela `core_instructions` (texto markdown versionado, ex.: "como ponderar evidência humano→cão") — análoga a RCs mas em prosa longa, vinculada por `instruction_rule_links`.

---

## 3) "Mapa de Influências" — o que é e por que confunde

**É**: tabela achatada de arestas `meta_study --[supports|contradicts|modulates_weight]--> core_rule`. Hoje só tem 1 linha, então parece vazia/inútil.

**Revisão**: renomear para **"Como cada regra é justificada"** com visualização em 2 modos:
- **Modo "Por Regra"** (padrão): para cada RC, mostrar lista de evidências que a sustentam + quotes literais + peso.
- **Modo "Grafo"** (Fase 2+): mini force-graph (reuso de `react-force-graph-2d`) com nós = {RC, Meta-Study, Instrução} e arestas tipadas/coloridas.

---

## 4) Em que isso se converte? KG próprio?

**Sim — é literalmente um Meta-KG** (separado do KG clínico). Já materializado em:
- `core_rules` (nós: regras)
- `meta_studies` (nós: estudos arquiteturais)
- `core_rule_evidence` (arestas tipadas: supports/contradicts/modulates)
- `core_rule_modulators` (parâmetros runtime aplicados pelo `hybrid-recommendation`)

**Como é consumido em runtime**: o edge `hybrid-recommendation` lê `core_rule_modulators WHERE is_active=true` e aplica os pesos (ex.: evidência humana × 0.7 para cognição). RCs sem modulator são **doc-only** (governança auditável, sem efeito direto em runtime — ainda valioso para reviewers e auditoria regulatória).

**Não é** Neo4j (não precisa de multi-hop pesado). Postgres+JSON é suficiente.

---

## 5) Sandbox de testes inteligente

**Excelente ideia**. Proposta: sub-tab **"Sandbox"** com 3 cenários comparáveis side-by-side:

- **Painel A — "Cenário Atual"**: roda `hybrid-recommendation` com RCs/modulators atuais sobre um pet de teste (ex.: Bob, FIV+ artrose).
- **Painel B — "Cenário Proposto"**: permite o curador editar temporariamente um modulator (slider de peso, toggle de RC) e ver o output diff em real-time **sem persistir**.
- **Diff**: highlight de compostos adicionados/removidos/reordenados, mudança de confidence, mudança de years_gained projetados.

Implementação: edge function `simulate-recommendation` que aceita `core_rule_overrides[]` no payload e devolve as duas execuções. Botão "Promover para produção" só aparece se o usuário admin aprovar — grava como nova versão do modulator (v1.0 → v1.1) preservando histórico.

---

## Plano técnico (faseado para não quebrar nada)

### Fase 3.1 — Score explainability (responde 7)
- Migrar `extract-study-entities` Stage 3 prompt para incluir `score_rationale: { quality, relevance, novelty }` em texto livre + `score_penalties: [{criterion, weight_lost, reason}]`.
- Atualizar `ScoreCriteriaPopover` para renderizar a 3ª coluna (peso/penalidade) e o rodapé com `score_rationale`.
- Backfill opcional via botão "Re-explicar scores" por estudo (não obrigatório — estudos antigos continuam funcionando, só sem rationale).

### Fase 3.2 — Harvest de RCs implícitas (responde 1)
- Criar migration que insere RC-004 a RC-018 em `core_rules` (status `active` para as que já estão em produção, `documented` para as que são doc-only).
- Adicionar coluna `runtime_effect` ('active' | 'doc_only' | 'planned') para deixar explícito quais RCs **realmente** modificam pipeline vs quais são governança.
- Atualizar `docs/CORE_RULES.md` em paralelo (canônico).

### Fase 3.3 — Ingestão curada (responde 2)
- Nova sub-tab "Ingestão" em Fundamentos.
- Edge function `extract-meta-study` (Gemini 2.5 Pro, chunking).
- Tabela `core_instructions` + `instruction_rule_links` (para .md curados).
- Fluxo: upload → AI sugere → humano aprova → grava evidência ou cria RC.

### Fase 3.4 — Renomear/revisar Mapa de Influências (responde 3)
- Renomear tab para "Justificativas" (PT) / "Justifications" (EN).
- Modo "Por Regra" como default (mais útil quando há poucas linhas).
- Force-graph visual fica como toggle opcional (carrega só se ≥5 evidências).

### Fase 3.5 — Sandbox de testes (responde 5)
- Sub-tab "Sandbox" com pet selector + diff view.
- Edge `simulate-recommendation` (reuso de `hybrid-recommendation` com `dry_run=true` + `overrides`).
- Versionamento de modulators (coluna `version` + `superseded_by`).

---

## Sequência sugerida e por que

**Recomendo executar 3.1 + 3.2 + 3.4 juntos** (1 turno, baixo risco — só adiciona colunas e UI, não muda runtime). Depois **3.3** (ingestão é grande, merece turno próprio). E **3.5** por último (sandbox depende de modulators versionados).

Quer que eu execute nessa ordem ou prefere outra priorização? Tem alguma das 15 RCs candidatas (RC-004..RC-018) que você quer **deixar de fora** do harvest inicial?
