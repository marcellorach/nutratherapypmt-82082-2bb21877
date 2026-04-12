

# Análise Profunda: Problemas na Classificação de Condições e Geração de Exemplos

## Problema Identificado

Você tem razão — há **dois problemas sérios e interligados**:

### Problema 1: "Cellular Senescence" é gravada como condição real no banco de dados

No `GenerateSamplePetsButton.tsx`, o Rex é criado com **Cellular Senescence como condição diagnosticada**:
```
conditions: [
  { condition_name: 'Osteoarthritis', severity: 'moderate', status: 'active' },
  { condition_name: 'Cellular Senescence', severity: 'mild', status: 'monitoring' },
]
```

Isso é gravado diretamente na tabela `pet_conditions` — **como se um veterinário tivesse diagnosticado senescência celular**. Um veterinário **nunca** diagnosticaria "senescência celular" — isso é um **processo biológico molecular**, não um diagnóstico clínico. Nenhum exame veterinário de rotina detecta isso.

### Problema 2: A classificação de origem é baseada em nome, não em fonte real

Em `ConditionInsightCard.tsx`, a função `inferOrigin()` decide a badge por **string matching**:
```typescript
if (condition.condition_name?.includes('senescen')) return 'inferred_comorbidity';
if (condition.condition_name?.includes('inflamm')) return 'inferred_comorbidity';
return 'vet_diagnosis';
```

Ou seja: a origem não é rastreada — é **adivinhada pelo nome**. Não existe coluna `origin` na tabela `pet_conditions`.

### Problema 3: O pipeline de insights mistura categorias

No `VetGraphRAGInsightsPanel.tsx`, condições de geociência são adicionadas automaticamente se existirem triplets no KG:
```typescript
const geroscience = ['Cellular Senescence', 'Inflammaging', ...];
// Se existir qualquer triplet mencionando o termo → vira "hidden_comorbidity"
```

Mas o mesmo termo já existe como condição real no banco (inserido pelo sample generator), criando **duplicação e confusão categórica**.

---

## Fluxo Atual (problemático)

```text
GenerateSamplePetsButton
  |
  +-- Grava "Cellular Senescence" em pet_conditions
  |   (como se fosse diagnóstico veterinário)
  |
  v
ConditionInsightCard.inferOrigin()
  |
  +-- Vê "senescen" no nome → badge "Comorbidade Inferida"
  |   (mas está no banco como condição real!)
  |
  v
VetGraphRAGInsightsPanel
  |
  +-- Também tenta inferir geociência do KG
  |   (duplica se já está no banco)
  |
  v
RESULTADO: Senescência aparece como "condição do paciente"
com badge de "inferida" — sem lógica clínica
```

---

## Plano de Correção

### 1. Adicionar coluna `origin` à tabela `pet_conditions`

Migração SQL para adicionar rastreamento real de origem:
```sql
ALTER TABLE pet_conditions ADD COLUMN origin TEXT DEFAULT 'vet_diagnosis';
-- Valores: 'vet_diagnosis', 'exam_suggested', 'breed_predisposition', 'kg_inference'
```

### 2. Corrigir dados de exemplo (`GenerateSamplePetsButton.tsx`)

**Remover** condições que veterinários não diagnosticam (Cellular Senescence, Inflammaging, Oxidative Stress) dos dados seed. Manter apenas condições clínicas reais:
- Rex: Osteoarthritis (diagnóstico vet real)
- Max: Cognitive Dysfunction Syndrome (diagnóstico vet real)

As condições gerocientíficas (senescência, inflamaging, stress oxidativo) devem ser **inferidas pela análise VetGraphRAG**, nunca pré-gravadas.

### 3. Reescrever `inferOrigin()` → usar coluna real

Em vez de adivinhar pelo nome, ler `condition.origin` do banco:
```typescript
function inferOrigin(condition: any): string {
  return condition.origin || 'vet_diagnosis';
}
```

### 4. Separar condições clínicas de inferências moleculares no VetGraphRAGInsightsPanel

O pipeline de insights deve:
- **Nunca gravar** inferências gerocientíficas na tabela `pet_conditions`
- Mantê-las apenas como insights temporários (categoria `hidden_comorbidity`) exibidos no painel de análise
- Exibir com badge diferente: "🧬 Inferência Molecular" em vez de "🔬 Comorbidade Inferida"

### 5. Criar taxonomia clara de tipos de condição

```text
NÍVEL 1 — Diagnósticos Clínicos (veterinário registra)
  Ex.: Osteoarthritis, Hip Dysplasia, MVD, CKD, Hypothyroidism
  Badge: 🩺 Diagnóstico Veterinário (verde)

NÍVEL 2 — Suspeitas por Exames (sistema sugere com base em labs)
  Ex.: Kidney Insufficiency (creatinina alta), Anemia (RBC baixo)
  Badge: 🧪 Sugerido por Exames (azul)

NÍVEL 3 — Riscos Raciais (predisposição genética, não diagnosticado)
  Ex.: "Labrador: risco 3.2x para Displasia" 
  Badge: 🧬 Predisposição Racial (âmbar)
  NÃO deve aparecer como "condição" — apenas como alerta

NÍVEL 4 — Processos Biológicos Inferidos (KG infere de evidências)
  Ex.: Cellular Senescence, Inflammaging, Mitochondrial Dysfunction
  Badge: 🔬 Processo Biológico Inferido (roxo)
  NÃO aparece na lista de condições — apenas no painel VetGraphRAG
  Inclui explicação: "Inferido porque Osteoarthritis → NF-κB → Senescence"
```

### 6. Atualizar i18n e documentação

- Novas chaves para "Processo Biológico Inferido" vs "Comorbidade Inferida"
- CHANGELOG.md, CURRENT_STATE.md

---

## Arquivos Afetados

| Ação | Arquivo | Risco |
|------|---------|-------|
| Migração | `pet_conditions` — coluna `origin` | Baixo (nullable, default) |
| Editar | `src/components/pet/GenerateSamplePetsButton.tsx` | Baixo |
| Editar | `src/components/pet/ConditionInsightCard.tsx` | Médio |
| Editar | `src/components/pet/VetGraphRAGInsightsPanel.tsx` | Médio |
| Editar | `src/locales/pt/translation.json` + EN | Nenhum |
| Editar | `src/i18n.ts` | Nenhum |
| Editar | `CHANGELOG.md` | Nenhum |

