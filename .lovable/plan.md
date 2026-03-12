

# Plano: Tags coloridas + predicados MODULATES/INHIBITS nos insights clínicos

## Problemas identificados

**a) Tags sem cor**: O `ConditionInsightCard` e `ScientificEvidencePanel` usam `Badge` genéricos cinza. O projeto já tem `NutraceuticalTag` (verde, com score de evidência) e `ConditionTag` (azul) prontos — basta usá-los.

**b) Predicados faltantes**: A edge function `condition-insights` só busca `TREATS, PREVENTS, AMELIORATES` para tratamentos e `HAS_MECHANISM, MODULATES, ACTIVATES, INHIBITS` apenas para mecanismos. Mas `MODULATES` e `INHIBITS` são fundamentais para ponderar tratamento — um composto que INHIBITS uma via inflamatória é tão relevante quanto um que TREATS a condição diretamente.

## Mudanças

### 1. `ConditionInsightCard.tsx` — usar tags coloridas
- Substituir `Badge variant="secondary"` dos tratamentos por `NutraceuticalTag` (verde, com confidence)
- Nos causal links, renderizar subject/object como `ConditionTag` (azul) quando forem condições
- Nos mecanismos, usar `NutraceuticalTag` para compostos e mostrar o predicado (MODULATES, INHIBITS) como badge colorido

### 2. `ScientificEvidencePanel.tsx` — usar tags coloridas
- Subject (composto) → `NutraceuticalTag`
- Object (condição) → `ConditionTag`
- Predicate badge → cor semântica: verde para TREATS/PREVENTS, vermelho para INHIBITS, laranja para MODULATES, azul para ACTIVATES

### 3. `ComorbidityMap.tsx` — usar tags coloridas
- Compostos sinérgicos → `NutraceuticalTag`
- Condições tratadas → `ConditionTag`

### 4. Edge function `condition-insights` — incluir mais predicados nos tratamentos
- Adicionar `INHIBITS`, `MODULATES` e `ACTIVATES` à query de tratamentos (seção 1), não só mecanismos
- Criar uma nova seção "modulators" que retorna compostos que INHIBITS/MODULATES vias biológicas ligadas às condições do pet
- Isso permite ao veterinário ver: "Fisetin INHIBITS NF-κB → reduz inflamação → ajuda Osteoartrite"

### 5. `ConditionInsightCard.tsx` — nova seção "Moduladores"
- Exibir compostos que INHIBITS/MODULATES/ACTIVATES vias relevantes
- Usar ícone de bionotação: ⊣ para INHIBITS, → para ACTIVATES, --→ para MODULATES

## Mapa de predicados → cor

| Predicado | Cor | Significado clínico |
|---|---|---|
| TREATS | verde | Tratamento direto |
| PREVENTS | verde-claro | Prevenção |
| INHIBITS | vermelho | Inibição de via patológica |
| MODULATES | laranja | Modulação |
| ACTIVATES | azul | Ativação de via protetora |
| AMELIORATES | teal | Melhora |

## Arquivos editados

| Arquivo | Ação |
|---|---|
| `src/components/pet/ConditionInsightCard.tsx` | Importar NutraceuticalTag/ConditionTag, adicionar seção moduladores |
| `src/components/pet/ScientificEvidencePanel.tsx` | Usar NutraceuticalTag/ConditionTag + predicate colors |
| `src/components/pet/ComorbidityMap.tsx` | Usar NutraceuticalTag/ConditionTag nos sinérgicos |
| `supabase/functions/condition-insights/index.ts` | Adicionar INHIBITS/MODULATES/ACTIVATES aos tratamentos, retornar `modulators` |

