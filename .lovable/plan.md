## Objetivo

Sair do mock no Population Insights — gerar **3 cohorts sintéticos reais** (prevenção, validação de tratamento, exploratório · 200 pets cada = 600 pets), rodar inferência longitudinal de verdade em cima deles, e plantar a base para `investigate-clinical-question` (#8) com painel multi-fonte híbrido (vet vê fontes, tutor vê síntese).

---

## Etapa 1 — Geração de cohorts sintéticos reais

**1.1 — Edge function `generate-synthetic-cohort`** (Lovable AI · Gemini 3-flash-preview)
- Entrada: recorte vindo do `CohortAISuggester` (ou manual).
- Para cada pet: gera raça/idade/peso/sexo, condições coerentes com o recorte, 3–8 exames laboratoriais com valores plausíveis (usa nossas faixas de referência caninas existentes em `src/services/condition-progression-engine` e `nutritionRequirementsCanine.ts`), histórico de 2–4 consultas com queixas correlatas, medicação atual.
- Tool calling estruturado (JSON validado), batches de 25 pets para caber em uma chamada.

**1.2 — Schema DB**
- Migration: adicionar `is_synthetic boolean default false` e `cohort_id uuid` em `pets` (e tabelas filhas relevantes: `pet_consultations`, `pet_exams` se existirem).
- Nova tabela `synthetic_cohorts` (id, name, kind, criteria jsonb, target_n, generated_at, created_by, status).
- RLS: leitura para `authenticated`, escrita só para admin (`is_admin()`).

**1.3 — UI**
- No `CohortAISuggester`, junto do botão "Usar esta sugestão →", adicionar **"Gerar cohort sintético (200 pets)"** que dispara a edge function com progresso (toast com contador).
- Nova sub-aba **"Cohorts sintéticos"** em Priorizações listando cohorts gerados, com botão "Excluir" (soft delete) e "Ver pets" (link filtrado).
- Banner "Esses pets têm flag `is_synthetic=true` e não contaminam dados reais futuros."

**1.4 — Confirmação de massa**
- Antes de gerar 600 pets, mostra confirmação com estimativa de custo (tokens) e tempo (~3 min).

---

## Etapa 2 — Population Insights v0 alimentado de verdade

**2.1 — Edge function `analyze-cohort-patterns`** (Gemini 3.5-flash)
- Lê todos os pets de um `cohort_id`, agrega: comorbidades frequentes, padrões laboratoriais cruzados (ex.: "78% dos Goldens 8+ com ALT alta também têm creatinina limítrofe"), gaps vs. KG curado.
- Saída estruturada: lista de Descobertas + Hipóteses + Meta-estudos propostos.

**2.2 — Substituir seed do `PopulationInsightsV0.tsx`**
- Trocar `populationInsightsSeed.ts` por busca real de `cohort_insights` (nova tabela) populada pela edge function.
- Manter o Kanban (Descobertas → Hipóteses → Meta-estudos propostos → Aprovados) com drag-and-drop simples para mover entre colunas.
- Badge "Cohort sintético — destrava aprendizado mas não substitui PetLove" continua visível.

---

## Etapa 3 — Fundação do `investigate-clinical-question` (#8) com painel híbrido

Apenas a fundação nesta etapa (a query orquestrada completa fica para uma próxima rodada quando #5 estiver pronto). Aqui entregamos:

**3.1 — Serviço `MultiSourceResolver`** (`src/services/multi-source-resolver.ts`)
- Interface única que aceita uma pergunta clínica e retorna `{ answer, sources: [{kind, weight, claim, confidence}], conflicts: [] }`.
- Implementa as 5 fontes como providers independentes:
  - `kgProvider` (consulta hierarchical_edges via RPC existente)
  - `petHistoryProvider` (lê histórico individual do cão se contexto pet for passado)
  - `cohortProvider` (agregação sobre cohort sintético)
  - `internetProvider` (chama Perplexity — já temos secret)
  - `treatedDogsProvider` (stub futuro)
- Resolução: hierarquia fixa (KG > histórico individual > cohort > internet) + detecção de conflito quando duas fontes de alto peso discordam.

**3.2 — Componente `<SourcePanel />`** colapsável
- Renderiza 1 linha por fonte com badge de confiança e ícone.
- Conflitos em laranja com tooltip explicativo.
- **Visibilidade híbrida:** usa `useRoleView()` → se `viewId === 'veterinarian'` ou `'platform_architect'`, painel renderiza. Se `'tutor'`, esconde e mostra só `answer` + uma nota "Síntese baseada em múltiplas fontes científicas."

**3.3 — Ponto de teste**
- Adicionar dentro da aba Priorizações um pequeno playground "Pergunte ao Senex AI multi-fonte" para validar antes de integrar nas telas clínicas.

---

## Decisões técnicas

```text
Fontes e pesos (documentado em src/services/multi-source-resolver.ts):
  KG curado                  → 1.0  (verdade científica)
  Histórico do cão           → 0.95 (personalização)
  Cohort longitudinal        → 0.7  (sinal populacional)
  Tratados na plataforma     → 0.6  (futuro)
  Internet (Perplexity)      → 0.3  (controle, busca de gaps)

Conflito = duas fontes com peso ≥ 0.6 e claims divergentes
         → badge laranja + ambos os claims expostos ao vet.
```

- Modelos: `gemini-3.5-flash` para `generate-synthetic-cohort` (volume) e `analyze-cohort-patterns` (raciocínio estruturado). Registrar ambos no `ai-task-router` e em `sync-system-prompts`.
- Bilinguismo: novas chaves `prioritization.cohort.synthetic.*` e `prioritization.populationInsights.*` em PT/EN, bump `I18N_VERSION`.
- Organograma + CHANGELOG sincronizados conforme protocolo.
- Tag de modelo (`gemini-3.5-flash` etc.) continua escondida para não-arquitetos.

---

## Não estão no escopo desta rodada

- Conector real à PetLove (continua tag "aguardando cohort PetLove" para diferenciar do sintético).
- #5 formulário de anamnese genérico (próxima rodada, em paralelo, quando você decidir).
- Integração do `investigate-clinical-question` orquestrado nas telas clínicas do pet (próxima rodada após validarmos no playground).
- Refactor RLS / camada de visualização do banco (continua na fila).

---

## Critério de "pronto"

1. Botão gera 1 cohort de 200 pets sintéticos em ≤ 3 min, marcados `is_synthetic=true`.
2. Population Insights v0 mostra ≥ 6 descobertas reais extraídas dos cohorts (não seed).
3. `<SourcePanel />` renderizado no playground com pergunta de teste, mostrando 3 fontes + 1 conflito sintético.
4. Tutor vê só síntese; veterinário vê fontes.