

# Reorganizar Fluxo Clínico: Separar Dados do Vet vs Resultados VetGraphRAG

## Problemas Identificados

**a) Confusão na origem das condições:** Hoje, na tab "Conditions" (antes da análise), já aparecem o `ComorbidityMap` e os `ConditionInsightCard` com tratamentos KG, mecanismos biológicos, exames sugeridos — tudo misturado com as condições informadas pelo veterinário. O vet não consegue distinguir o que é **dado clínico registrado** do que foi **inferido pelo sistema**.

**b) Análise detalhada por condição antes do VetGraphRAG:** O `ConditionInsightCard` mostra KG Treatments, Modulators, Biological Mechanisms e Suggested Pre-Treatment Exams — tudo isso são resultados de análise do Knowledge Graph que só fazem sentido **depois** do processamento VetGraphRAG, não antes.

## Solução Proposta

### 1. Tab "Conditions" ANTES da análise: apenas dados clínicos puros

Na tab Conditions, **remover** o `ComorbidityMap` e simplificar o `ConditionInsightCard` para mostrar APENAS:
- Nome da condição, severidade, status (active/monitoring/resolved)
- Notas do veterinário
- Origem visual: badge indicando **"Informada pelo Vet"**, **"Identificada por Exames"**, ou **"Predisposição Racial"** (baseado no campo `source` ou `diagnosed_by` se existir, senão inferir: se tem notes → vet, se não → exames/sistema)

**Remover** da tab Conditions pré-análise:
- ComorbidityMap (conexões entre condições)
- KG Treatments, Modulators & Inhibitors, Biological Mechanisms
- Suggested Pre-Treatment Exams

### 2. Mover análise detalhada para DEPOIS do VetGraphRAG

Após o pipeline stepper e o `VetGraphRAGInsightsPanel`, adicionar uma nova seção ou tab **"Análise por Condição"** que contém:
- `ComorbidityMap` (agora contextualizado como resultado da análise)
- `ConditionInsightCard` completo (com KG Treatments, mecanismos, exames sugeridos) — mas agora claramente rotulado como "Análise VetGraphRAG"

### 3. Badges de origem nas condições

Adicionar badges visuais em cada condição:
- 🩺 **"Diagnóstico Veterinário"** (verde) — condições registradas pelo vet
- 🧪 **"Sugerida por Exames"** (azul) — condições inferidas de resultados laboratoriais
- 🧬 **"Predisposição Racial"** (âmbar) — condições baseadas em raça/idade
- 🔬 **"Comorbidade Inferida"** (roxo) — condições deduzidas pelo KG (ex: senescência celular)

### Arquivos a editar

- **`PetProfilePage.tsx`**: Remover ComorbidityMap e ConditionInsightCard detalhado da tab Conditions pré-análise; mover para seção pós-VetGraphRAG
- **`ConditionInsightCard.tsx`**: Criar modo "simple" (apenas nome/severity/status/origin badge) vs "full" (com KG data) controlado por prop
- **Traduções PT/EN**: Novas chaves para badges de origem e títulos de seção
- **`i18n.ts`**: Incrementar versão

