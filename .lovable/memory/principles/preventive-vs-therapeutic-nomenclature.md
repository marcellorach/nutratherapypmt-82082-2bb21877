---
name: Preventive vs Therapeutic Nomenclature
description: Standard terminology to distinguish preventive/prophylactic suggestions from therapeutic/curative ones across nutraceuticals, foods and drugs UI.
type: principle
---

# Preventivo vs Terapêutico — Nomenclatura Padrão

Toda recomendação (nutracêutico, ração, droga) deve declarar a **intenção clínica**:

- **Profilática / Preventiva** (`intent: preventive`) — pet **NÃO** tem a condição. Ação reduz risco baseado em fator (predisposição racial, marcador subclínico, idade). UI: badge azul "Profilática (preventiva)".
- **Terapêutica / Curativa / de Manejo** (`intent: therapeutic`) — pet **JÁ** diagnosticado. Ação trata, cura ou maneja. UI: badge âmbar/destrutivo "Manejo terapêutico".
- **Suporte** (`intent: supportive`) — adjunto (ex.: hepatoprotetor durante quimio). Cor neutra.

## Regras

1. Sempre que uma sugestão derivar de `breed_predispositions` e `already_active === false` → marcar **preventiva**.
2. Quando derivar de uma condição ativa do pet → marcar **terapêutica**.
3. Trocar de "ração para diabetes" → "**ração com perfil profilático para diabetes**" quando o pet não é diagnosticado.
4. Em PT preferir os termos vet aceitos: *profilaxia nutricional*, *manejo dietético*, *dieta terapêutica*.
5. Bilíngue obrigatório: `preventive` / `therapeutic` no schema; `Profilática` / `Manejo terapêutico` em PT-BR; `Prophylactic` / `Therapeutic management` em EN.

## Where applied

- `NutritionGapAnalysis.tsx` — seção "Sugerido pela raça" agora usa badge preventivo/terapêutico.
- Próximas iterações: `hybrid-recommendation` edge function deve emitir `intent` por item; `VetRecommendationPanel` deve renderizar o badge.