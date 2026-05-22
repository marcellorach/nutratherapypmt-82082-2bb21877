# Fase 1 — Ontologias canônicas + Negative Controls

## Correção factual antes do plano

Eu errei o número de estudos na análise anterior. Confirmado no banco agora:

- `scientific_studies` (catálogo bibliográfico): **13**
- `processed_studies` / `study_extractions` (estudos efetivamente digeridos): **57**
- `triplet_extractions`: **4.759**
- `nutraceuticals`: **30** · `health_conditions`: **191** · `nutraceutical_conditions`: **77**
- `meta_studies` (Fundamentos): **4**

Ou seja: **57 estudos digeridos, não 13**. O número não muda o veredito (DWPC e GNN continuam prematuros para 30 compostos / 77 links curados), mas muda a régua: já temos massa para começar Fase 1 com segurança.

## Escopo de Fase 1 (um único plano, conforme pedido)

Três entregas costuradas, na ordem em que a dependência exige:

### 1. `canonical_id` + integração de ontologias externas (OMIA, MeSH, ChEBI)

Problema: hoje "DCC", "Disfunção Cognitiva Canina" e "Canine Cognitive Dysfunction" podem viver como nós diferentes. Sem identidade canônica, qualquer métrica derivada (DWPC, cobertura, sinergia) mede ruído.

- `health_conditions.canonical_id text` + `canonical_source text` (`omia` | `mesh` | `mondo` | `manual`).
- `nutraceuticals.canonical_id text` + `canonical_source text` (`chebi` | `pubchem` | `mesh` | `manual`).
- Índices únicos parciais por (`canonical_source`, `canonical_id`) quando ambos preenchidos.
- Reuso de `veterinary_ontology` para guardar o dump (novas `source = 'omia' | 'mesh_geriatric_canine'`).
- Função de resolução: nome (PT/EN) → `canonical_id` via match exato + sinônimos + fuzzy, com fallback manual no admin.

### 2. Dump curado offline OMIA + MeSH (subset geriatria canina)

Escolha técnica: **dump offline**, não API em tempo real. Justificativa:
- OMIA expõe dumps oficiais (`omia.txt.gz`, espelhado no NCBI FTP); o universo útil para nós (raças × fenótipos hereditários caninos) cabe em algumas centenas de linhas.
- MeSH disponibiliza descritores anuais em XML (`desc2026.xml`). Filtramos pelos ramos C (doenças) e D (compostos/nutrientes) relevantes para geriatria canina (~300–500 termos).
- Custo zero, sem dependência de uptime externo, totalmente versionável.

Plano operacional:
- Script `scripts/import-ontology-dump.ts` lê o dump local, normaliza e faz `upsert` em `veterinary_ontology`.
- Edge function `resolve-canonical-term` (opcional, fase seguinte) para autocompletar no admin.
- Documentação em `docs/ONTOLOGY_SOURCES.md` listando origem, licença, data do dump e procedimento de refresh anual.

### 3. Predicate `FAILS_TO_TREAT` + seed inicial de controles negativos

- Migração: adicionar valor `'FAILS_TO_TREAT'` ao enum/dicionário de predicates já usado em `triplet_extractions` (verificar tipo real durante implementação; se for texto livre, basta padronizar no validator).
- Atualizar `predicate-mapping` e o validator para aceitar o novo predicate como categoria "evidência negativa".
- Inserir manualmente 5–10 pares canônicos clássicos como tripletes aprovados, com citação:
  - Glicosamina + Condroitina → osteoartrite canina (Bhathal et al., 2017; AAHA 2022).
  - Vitamina E (alta dose) → declínio cognitivo (extrapolação humana, Petersen 2005 — flag de translacional).
  - β-caroteno → câncer de pulmão (CARET, ATBC — flag de translacional).
  - SAMe isolado → hepatopatia avançada (sem efeito além de suporte).
  - Coenzima Q10 → progressão de DRC canina (sem evidência clínica robusta).
- UI: badge vermelha "Evidência negativa" no card do triplete e penalização explícita no scoring de recomendação.

## Critérios de aceitação (Fase 1)

- 100% das 30 nutracêuticas têm `canonical_id` (ChEBI ou MeSH).
- ≥ 80% das 191 condições têm `canonical_id` (OMIA quando hereditário, MeSH no resto).
- Resolver de nomes funciona PT/EN com fallback manual.
- Pelo menos 5 tripletes `FAILS_TO_TREAT` aprovados e visíveis no KG com badge distinta.
- Recomendador respeita evidência negativa (não recomenda composto com `FAILS_TO_TREAT` ativo para aquela condição).
- `docs/ONTOLOGY_SOURCES.md`, `CHANGELOG.md`, memórias e organograma sincronizados via `npm run sync:changelog`.

## Fora de escopo (registrar e adiar)

- DWPC offline + permutation testing → Fase 2 (depois que `canonical_id` estabilizar).
- Camada agêntica estilo MEDEA → Fase 3.
- TxGNN/GNN → Fase 3 (esperar ≥ 80 compostos curados).

---

## Anexo — Fase A entregue (referência histórica)

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
