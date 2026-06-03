# ROADMAP — Senex AI (motor PetMoreTime)

> **Curado, não gerado.** Derivado da matriz de honestidade em
> `docs/generated/ARCHITECTURE_LIVE.md` (verdade-base) + gaps de
> `src/data/complianceData.ts` + CHANGELOG `[Unreleased]`. Revisar a cada
> release. Não inventar entregas que não estejam no código ou explicitamente
> planejadas em CORE_RULES.md / ADR.
>
> Última revisão: 2026-06-03.

## Princípios

1. **Honestidade primeiro:** nada entra como "implementado" sem linha 🟢 na
   matriz LIVE. Inspiração científica fica no roadmap como inspiração, nunca
   como compromisso de release.
2. **Conflitos pendentes bloqueiam release:** o limiar de auto-aprovação tem
   três fontes não reconciliadas (código `≥0.85 & ≥0.50`, RC-013 `≥0.70`,
   ADR/CONTEXT `≥0.50`). Reconciliar antes de qualquer publicação que
   prometa "rigor" no número.
3. **P0 = compliance gap:** itens marcados P0 vêm de `complianceData.ts` e
   bloqueiam claims clínicos públicos.

## Now (em execução / próximo turno)

| Item | Origem | Status | Bloqueia |
|---|---|---|---|
| Reconciliar limiar de auto-aprovação (código × RC-013 × ADR) | matriz LIVE linha 7 | aberto | claim público "two-tier governance" |
| Aplicar registro de honestidade ao `audit_base` (PT+EN) | este turno | feito | — |
| Gerar `PROMPTS.md` snapshot | este turno | feito | — |
| Corrigir cabeçalho de `condition-progression-engine.ts` (texto fala "nunca inventa sigmoide", código É sigmoide) | matriz LIVE linha 8 | aberto | confiança da documentação interna |

## Next (planned, sem data — exige discussão de escopo)

| Item | Origem | Por que importa |
|---|---|---|
| `outcome_observations` (tracking pós-deploy de eficácia real) | FDA gap (`complianceData.ts`) | P0: sem isso, "evidence-based" é só literatura, não prática. |
| Guarda `species=canine` (impedir extrapolação felino/equino) | AVMA gap (`complianceData.ts`) | P0: clínica fora de cão não está validada. |
| Ligar modulador RC-003 (ponderação humano→cão ×0.7) | `docs/CORE_RULES.md:80` | Hoje pesos translacionais entram crus; modulador existe na regra, não no scoring. |
| Reviewer independente (substituir heurístico por modelo separado) | matriz LIVE linha 2 (GRRA 🟠) | Verificação independente é a maior lacuna do Bloco 2. |
| Fusão hierárquica real top-down/bottom-up (substituir concatenação) | matriz LIVE linha 3 (U-Retrieval 🟠) | Hoje resultados Cypher e pgvector são concatenados, não fundidos. |

## Later (inspiração, sem compromisso)

| Item | Origem |
|---|---|
| TransE / embeddings para gap-fill | matriz LIVE linha 4 — hoje gap-fill é PubMed + Gemini, não embedding. |
| Threshold de auto-aprovação configurável por admin | matriz LIVE linha 7 — hoje hardcoded. |
| Painel público de proveniência por número (medido vs paper) | registro de honestidade do `audit_base`. |

## Fora de escopo (explicitamente)

- Imagem médica complexa (MRI, etc.) — escopo clínico é metabólico/degenerativo canino.
- Recomendação sem ancoragem no KG sem rótulo `source='llm_fallback' + disclaimer='no_kg_data'`.
- Apresentar benchmark de literatura (ex.: ~87% KGARevion, ~40% MedGraphRAG) como métrica do Senex.

## Como manter este arquivo

1. Reler `docs/generated/ARCHITECTURE_LIVE.md` antes de editar (verdade-base).
2. Mover item de **Now → done** apenas após linha correspondente virar 🟢 na matriz.
3. Registrar a mudança em `CHANGELOG.md` (`[Unreleased]`) e rodar `npm run sync:changelog`.