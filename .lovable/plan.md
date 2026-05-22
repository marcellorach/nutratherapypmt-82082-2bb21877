# Fase A — Sandbox + Confiabilidade do Meta-Estudo (Fundamentos)

Escopo mínimo, seguro e reversível. Prepara o terreno para Fase B (Meta-KG navegável) e Fase C (RAG do meta-KG) sem refatorar a modelagem atual das lições.

## O que entra agora

1. **Lifecycle dos meta-estudos** (sandbox)
   - Estados: `inbox` → `triaged` → `in_review` → `approved` → `archived`.
   - Mesma tabela `meta_studies`, nova coluna `lifecycle_status` (enum). Nada de migrar linhas entre tabelas.
   - Default em novos uploads: `inbox`.
   - Promoção a `approved` continua exigindo a curadoria atual das `proposed_rules` (não muda regra de segurança).

2. **Confiabilidade do estudo (0–5)** — 5 dimensões em `meta_studies`:
   - `reliability_methodology` (rigor do método)
   - `reliability_evidence_base` (qualidade/volume das fontes citadas)
   - `reliability_applicability` (aplicabilidade ao contexto canino/geroprotetor)
   - `reliability_reproducibility` (replicabilidade do que propõe)
   - `reliability_relevance` (relevância translacional)
   - `reliability_overall` = coluna gerada (média das 5, ignorando nulls).
   - Preenchimento manual; IA pode sugerir valores em `reliability_suggested` JSONB, mas só humano confirma.

3. **Kanban "Estudos Arquiteturais"** dentro da aba Fundamentos
   - 4 colunas: Inbox · Triados · Em Revisão · Aprovados (Arquivados em filtro).
   - Card mostra: título, score de confiabilidade (badge colorida), nº de `proposed_rules`, data.
   - Mover card = update de `lifecycle_status` (drag-and-drop; fallback botão).

4. **Card "Roadmap do Meta-KG"** fixo na aba Ingestão
   - Lista o que ainda falta: Fase B (lições como entidades + tripletes arquiteturais + vínculo RC↔lição) e Fase C (embedding/RAG do meta-KG).
   - Serve como lembrete permanente.

## O que NÃO entra (e por quê)

- Lições como entidades de primeira classe → Fase B. Risco alto; usar Fase A antes informa o desenho.
- Tripletes arquiteturais entre RCs/padrões → Fase B.
- Vínculo bidirecional RC↔lição → Fase B (depende do anterior).
- Embedding/pgvector do meta-KG → Fase C. Só vale com ≥30 meta-estudos.

## Detalhes técnicos

**Migração (uma só):**
- `CREATE TYPE meta_study_lifecycle AS ENUM ('inbox','triaged','in_review','approved','archived')`.
- `ALTER TABLE meta_studies ADD COLUMN lifecycle_status meta_study_lifecycle NOT NULL DEFAULT 'inbox'`.
- Backfill: com `proposed_rules` aprovadas → `approved`; com análise sem aprovação → `in_review`; com extração feita → `triaged`; sem análise → `inbox`.
- 5 colunas `reliability_*` `numeric(2,1)` com CHECK 0–5 + `reliability_suggested jsonb` + `reliability_overall` GENERATED STORED.
- Índice em `lifecycle_status`.
- RLS: mantém policies atuais; só admin altera lifecycle/reliability.

**Frontend:**
- `EstudosTab` ganha sub-tabs: "Ingestão" (atual) + "Kanban".
- Novo `MetaStudyKanban` (reaproveita estilo de `EstudosColumn`).
- `MetaStudyCard` com badge de confiabilidade (verde ≥4, amarelo 2.5–4, vermelho <2.5, cinza sem score).
- Dialog de detalhe: 5 sliders de confiabilidade + botão de mudança de estado.
- Card "Roadmap do Meta-KG" no topo da aba Ingestão.
- i18n PT/EN completo; incremento de `I18N_VERSION`.

**Edge functions:** nenhuma nova. Preenchimento opcional de `reliability_suggested` pela IA fica como follow-up, não bloqueia A.

## Documentação

- `docs/TECHNICAL_DECISIONS.md`: nova seção "Meta-Study Lifecycle & Reliability" + Histórico.
- `docs/GRAPHRAG_ARCHITECTURE.md`: nota sobre o sandbox no bloco de Fundamentos.
- `CHANGELOG.md`: entrada em `[Unreleased]` (area: fundamentos).
- Memória: nova entry `mem://architecture/meta-study-lifecycle-and-reliability` + ref no index.
- `npm run sync:changelog` ao final.

## Critérios de aceitação

- Upload novo cai em `inbox` automaticamente.
- Kanban renderiza os 4 estados com contagem correta.
- Drag entre colunas persiste e sobrevive a reload.
- Score editável; `reliability_overall` recalcula sozinho.
- Card "Roadmap do Meta-KG" visível com Fase B e C listadas.
- Promoção a `approved` segue bloqueada pela curadoria das `proposed_rules`.
- Paridade PT/EN completa nas strings novas.
