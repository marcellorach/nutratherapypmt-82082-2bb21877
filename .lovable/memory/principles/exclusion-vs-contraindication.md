---
name: Exclusion criteria vs Contraindication (RC-001)
description: Critério de exclusão de trial NÃO é contraindicação — é lacuna de evidência. Aplicado em Stage 3 prompt e UI de detalhes do estudo.
type: principle
---

**Rule**: When a study reports that a population was excluded from the trial, classify it as an evidence gap, NOT as a contraindication. Contraindication requires explicit language of harm, risk, or recommendation against use.

**Why**: Mixing exclusion with contraindication subestimates eligible populations and pollutes the KG with false restrictions.

**Where applied**:
- `supabase/functions/extract-study-entities/index.ts` → Stage 3 system prompt (rule #8)
- `src/components/administrador/estudos/visualization/ExtractedDataVisualization.tsx` → amber banner above Contraindications section
- Canonical source: `docs/CORE_RULES.md` → RC-001

**See also**: RC-002 (adverse events negation handling).