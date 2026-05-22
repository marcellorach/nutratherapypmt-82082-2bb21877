---
name: Canonical IDs & Negative Evidence (Fase 1)
description: health_conditions e nutraceuticals têm canonical_id+canonical_source (OMIA/MeSH/ChEBI). triplet_extractions tem evidence_polarity (positive default; negative bloqueia recomendação). Dump offline versionado em data/ontologies/ — ver docs/ONTOLOGY_SOURCES.md.
type: architecture
---

**Identidade canônica**
- `health_conditions.canonical_id` + `canonical_source` (`omia`|`mesh`|`mondo`|`snomed`|`umls`|`manual`).
- `nutraceuticals.canonical_id` + `canonical_source` (`chebi`|`pubchem`|`mesh`|`kegg`|`manual`).
- Índice único parcial por par (source, id). Resolve "DCC" vs "Disfunção Cognitiva Canina" como mesmo nó.

**Evidência negativa**
- `triplet_extractions.evidence_polarity` text NOT NULL default `'positive'`, CHECK in (`positive`,`negative`,`neutral`,`inconclusive`).
- Recomendador deve ler polaridade e bloquear compostos com `negative` para aquela condição.
- Backfill: predicates legados (`fails_to_treat*`, `no_effect*`, `worsens*`, `contraindicat*`) viram `negative`.

**Dumps offline** (sem dependência de API externa em runtime):
- OMIA `omia.txt.gz` (filtra taxonomy 9615 = Canis).
- MeSH `desc2026.xml` + `supp2026.xml` (filtra trees C, D, G06.184, D26).
- ChEBI já integrado via `fetch-external-ontologies`.
- Importer: `scripts/import-ontology-dump.ts`. Dumps em `data/ontologies/` (gitignored).
- Refresh anual; ver `docs/ONTOLOGY_SOURCES.md` para URLs e licenças.

**Pendências Fase 1** (não fechar até implementar):
- Parser MeSH XML (atualmente stub).
- UI badge "Evidência negativa" nos cards de triplete.
- Seed manual: 5–10 pares `FAILS_TO_TREAT` canônicos (glicosamina+condroitina/OA canina, vit E/MCI, β-caroteno/câncer pulmão, SAMe/hepatopatia avançada, CoQ10/DRC canina).
- Integração da polaridade no `hybrid-recommendation-service`.

**Fora de escopo (Fase 2+):** DWPC, permutation testing, camada agêntica MEDEA, TxGNN.