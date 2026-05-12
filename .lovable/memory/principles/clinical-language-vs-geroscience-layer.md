---
name: Clinical Language vs Geroscience Layer
description: Vets write traditional clinical language; geroscience interpretation (senescence, inflammaging, NAD+, autophagy, hallmarks) is system-only and must be labeled as system inference.
type: principle
---

# Linguagem clínica vs. camada de gerociência

**Princípio:** Veterinários (e 99% dos médicos) NÃO conhecem os fundamentos da gerociência. Por isso:

- **Vet escreve em linguagem clínica tradicional**: OA moderada, ALT elevada, perda de massa muscular, Carprofen 2 mg/kg BID, polidipsia, etc.
- **Camada de gerociência** (senescência celular, inflammaging, disfunção mitocondrial, NAD+, autofagia, hallmarks of aging, senolíticos, geroprotetores) **é responsabilidade do sistema** — nunca atribuída ao vet em consultas/anamneses/condutas demo, nem solicitada como input.

## Aplicação

1. **Inputs do vet** (consultas demo, formulários, extrações de texto livre): apenas vocabulário clínico tradicional. Sem "marcadores de envelhecimento", "NMN", "senolíticos", "inflammaging".
2. **Outputs do sistema** (recomendações IA, insights de condições): DEVEM mapear achado clínico → hallmark/pathway de gerociência → composto, sob badge/prefixo **"Inferência de gerociência — gerada pelo sistema"**.
3. **Edge functions impactadas**: `hybrid-recommendation`, `extract-pet-clinical-data`, `condition-insights`. Prompts forçam a separação.
4. **UI**: badge "Inferência de gerociência (gerada pelo sistema)" separa visualmente conteúdo do sistema da nota do vet.

## Por quê

Sem essa separação, demos parecem que o vet "já sabia" gerociência — quebra credibilidade clínica e mistura responsabilidades. O valor único do produto é justamente fazer essa ponte.