# Auditoria: Onde as predisposições raciais influenciam de fato o sistema

**Data:** 2026-05-17 · **Escopo:** verificar se `breed_predispositions` é apenas catálogo ou se realmente entra nas análises clínicas e no KG.

## TL;DR

✅ **Sim, predisposições afetam o resultado final em 5 lugares distintos.** Não é tabela "morta" — `risk_factor` e `evidence_grade` participam de cálculos numéricos (projeção biológica), de classificação de condições (badge "Raça") e do prompt do modelo de recomendação (`hybrid-recommendation`).

## Mapa de consumo

```text
public.breed_predispositions
        │
        ├─► src/hooks/useBreedPredispositionsForPet.ts
        │      ├─► src/components/pet/BiologicalTimeline.tsx
        │      │       └─► biological-timeline-engine.ts
        │      │             • risk_factor multiplica a inclinação da curva
        │      │             • evidence_grade pondera o intervalo de confiança
        │      │
        │      └─► src/services/clinical-analysis-pipeline.ts
        │              • Insere condição com origem = "Raça"
        │              • Render do badge âmbar no PetProfilePage
        │
        ├─► supabase/functions/hybrid-recommendation/index.ts
        │       • Recebe a lista no prompt do Gemini
        │       • Usada junto de usePetCompoundCoverage para selecionar compostos
        │
        ├─► supabase/functions/project-pet-trajectory/index.ts
        │       • Trajetória do Digital Twin (anos ganhos)
        │
        ├─► supabase/functions/relations-auditor/index.ts
        │       • Permite auditar via chat: "Quais condições da raça X têm KG?"
        │
        └─► supabase/functions/sync-ontology-to-neo4j/index.ts
                • Cria nós (:Breed)-[:PREDISPOSED_TO]->(:Condition) com risk_factor
                • Aparece como aresta BREED_RISK_FOR no PatientKnowledgeSubgraph
```

## Efeitos quantitativos confirmados

| Campo | Onde é usado | Como afeta |
|---|---|---|
| `risk_factor` | timeline-engine, project-pet-trajectory | Multiplicador da severidade projetada (1.0 = neutro, 3.0 = risco triplicado) |
| `evidence_grade` | timeline-engine, hybrid-recommendation | `high`/`moderate` pesam mais no prompt; `preliminary` é exibido com disclaimer |
| `notes` | hybrid-recommendation prompt | Texto livre vai ao modelo como contexto extra |
| `supporting_study_ids` | UI (a expor) | Referências cruzadas com `scientific_studies` |
| `genetic_profile` (novo) | UI + prompt KG | Mostrado ao vet; será injetado no prompt de gap-fill para reforçar especificidade |
| `prevalence_pct` (novo) | UI + projection | Reforça o peso na curva quando >10% na raça |
| `sources` (novo) | UI | Links clicáveis no painel; futuro: validação cruzada |

## Pontos onde **não** é usado (intencionalmente)

- **Curation pipeline de estudos**: predisposições não filtram extração — estudo é estudo, raça vem depois.
- **Painel administrativo de Condições**: não cruza com raças (correto: tabela mestra).
- **Pipeline de nutrição (`nutrition-gap-analyzer`)**: usa predisposições apenas para alertas "raça grande precisa de glucosamina", já implementado.

## Conclusão

A pergunta "as predisposições afetam KG/análises?" tem resposta **sim em todas as camadas críticas**. A expansão de catálogo proposta (mais raças, mais fontes, perfil genético) tem ROI imediato porque cada novo registro entra automaticamente em 5 pipelines.
