## Problema

No card "Pilares científicos (inspiração × implementação)" em `AboutSenexTab.tsx`, KGARevion aparece como **INSPIRATION** com texto focado apenas no que **não** está implementado (ciclo GRRA — Review+Revise independentes).

A aba "Fundamentos Arquiteturais" (alimentada por `core_rule_evidence` no banco) mostra que KGARevion é evidência de apoio (`supports`) para **2 regras ativas em runtime**:

- **RC-008** — Taxonomia Padrão (SNOMED-CT VetSCT + UMLS) · weight 0.95
- **RC-014** — Normalização de Predicados via Dicionário · weight 0.90

Pela mesma régua aplicada a MedGraphRAG (parte implementada + parte inspiração → `PARTIAL`), KGARevion deveria ser **PARTIAL**, não `INSPIRATION`.

## Mudança

Arquivo único: `src/components/administrador/AboutSenexTab.tsx` (entrada KGARevion no array `pillars`, ~linhas 95–101).

1. `status: 'inspiration'` → `status: 'partial'`
2. Reescrever `detail_pt` / `detail_en` com a mesma estrutura do MedGraphRAG: **o que está implementado** (citando as RCs) + **o que continua inspiração**.

### Texto proposto (PT)
> **Parcial.** Em runtime, o dicionário de normalização de predicados (RC-014) e a adoção de taxonomia padrão SNOMED-CT VetSCT + UMLS (RC-008) seguem KGARevion como evidência ativa. **Inspiração ainda não implementada:** o ciclo GRRA completo (Review + Revise independentes) — hoje `generate-triplets` roda Generate (Gemini) + scoring heurístico (0,65–0,75) + auto-approve ≥ 0,50 + HITL. O número ~87% é benchmark do paper, não medido no Senex.

### Texto proposto (EN)
> **Partial.** In runtime, the predicate-normalization dictionary (RC-014) and the SNOMED-CT VetSCT + UMLS standard taxonomy adoption (RC-008) follow KGARevion as active evidence. **Inspiration not yet implemented:** the full GRRA cycle (independent Review + Revise) — today `generate-triplets` runs Generate (Gemini) + heuristic scoring (0.65–0.75) + auto-approve ≥ 0.50 + HITL. The ~87% figure is a paper benchmark, not measured inside Senex.

Sem mudança no diagrama Mermaid (já anota corretamente "inspired by GRRA, no independent reviewer") nem no banner de honestidade arquitetural (que cita GRRA como inspiração — segue verdadeiro).

## Versionamento

Edição de honestidade de copy em painel existente → **PATCH** (`7.2.0` → `7.2.1`). Bump do marker em `CHANGELOG.md` + entrada em `[Unreleased]` (`area: admin · status: changed · i18n: none`) + `npm run sync:changelog`.

## Fora de escopo

- Não mexer no MedGraphRAG, TransE, Canine geroscience.
- Não alterar `core_rule_evidence` no banco — vínculos já existem.
- Se você quiser, em passo separado, podemos auditar se outros papers do Fundamentos têm vínculo `active` e estão sub-representados aqui (ex.: TxGNN/OptimusKG em RC-013 modulates_weight).
