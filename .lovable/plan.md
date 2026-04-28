# Substituir categorias genéricas por doenças específicas

## Problema

Você está certo: **"Cardiovascular Disease" é uma categoria**, não uma doença. O mesmo se aplica a "Chronic Inflammation". O perfil clínico exige a doença real (ex: Cardiomiopatia Dilatada, Doença Valvar Mitral Mixomatosa, etc.) para que o motor de recomendação consiga cruzar com o Knowledge Graph corretamente.

Verifiquei o banco — temos as doenças canônicas corretas em `health_conditions`:
- `Doença Valvular Degenerativa` / `Degenerative Valve Disease (Myxomatous Mitral Valve Disease)`
- `Cardiomiopatia dilatada` / `Dilated Cardiomyopathy`
- `Aterosclerose` / `Atherosclerosis`
- `Insuficiência cardíaca` / `Heart Disease`

E os pets demo atualmente no banco têm:
- **Luna** (Cavalier King Charles, sopro 4/6, VHS 11.5): hoje gravada como `Cardiovascular Disease` ❌
- **Thor** (Pastor Alemão, CRP elevado): hoje gravada como `Chronic Inflammation` ❌ (também é categoria)

## Correções

### 1. Pets de exemplo (`GenerateSamplePetsButton.tsx`)

Trocar nas definições do `SAMPLE_PETS`:

| Pet | Antes | Depois | Justificativa clínica |
|-----|-------|--------|-----------------------|
| **Luna** (Cavalier King Charles, 6a, sopro 4/6, coração aumentado) | `Cardiovascular Disease` | `Degenerative Valve Disease (Myxomatous Mitral Valve Disease)` | MMVD é a doença #1 da raça, compatível com sopro mitral e VHS aumentado |
| **Thor** (Pastor Alemão, CRP 15.2) | `Chronic Inflammation` | `Hip Dysplasia` (já indicado no exame `hips: 'mild dysplasia'`) | Doença real, não categoria; CRP elevado é achado, não diagnóstico |

Os demais pets (Rex, Mel, Max) já usam doenças específicas corretas (`Osteoarthritis`, `Cognitive Dysfunction Syndrome`).

### 2. Migração de dados existentes no banco

Como já existe a Luna no banco com a condição errada, criar migração que faz UPDATE:

```sql
UPDATE pet_conditions
SET condition_name = 'Degenerative Valve Disease (Myxomatous Mitral Valve Disease)'
WHERE condition_name = 'Cardiovascular Disease';

UPDATE pet_conditions
SET condition_name = 'Hip Dysplasia'
WHERE condition_name = 'Chronic Inflammation';
```

### 3. Guard-rail: validação anti-categoria

Criar lista pequena de "termos proibidos" (categorias genéricas) em `src/utils/conditionValidation.ts`:

```ts
export const GENERIC_CATEGORY_TERMS = [
  'Cardiovascular Disease', 'Cardiovascular',
  'Chronic Inflammation', 'Inflammation',
  'Heart Disease', 'Renal Disease', 'Liver Disease',
  'Metabolic Disease', 'Neurological Disease',
];

export function isGenericCategory(name: string): boolean { ... }
```

Usar em dois lugares:
- **`GenerateSamplePetsButton`**: dev-warning no console se algum sample usar termo proibido (previne regressão)
- **Edge function `extract-pet-clinical-data`**: quando IA extrair texto livre, rejeitar/sinalizar nomes genéricos pedindo doença específica

### 4. Tradução PT/EN

Adicionar entradas em `src/locales/{pt,en}/translation.json` para a nova condição visível na UI da Luna:
- `conditions.degenerativeValveDisease` → "Doença Valvular Degenerativa (MMVD)" / "Degenerative Valve Disease (MMVD)"
- `conditions.hipDysplasia` → "Displasia Coxofemoral" / "Hip Dysplasia"

Incrementar `I18N_VERSION` em `src/i18n.ts`.

## Arquivos afetados

| Ação | Arquivo | Risco |
|------|---------|-------|
| Editar | `src/components/pet/GenerateSamplePetsButton.tsx` | Baixo |
| Criar | `src/utils/conditionValidation.ts` | Nenhum |
| Editar | `supabase/functions/extract-pet-clinical-data/index.ts` | Baixo (só warning) |
| Migração | UPDATE em `pet_conditions` (Luna + Thor) | Baixo |
| Editar | `src/locales/pt/translation.json` + EN | Nenhum |
| Editar | `src/i18n.ts` (bump versão) | Nenhum |
| Editar | `CHANGELOG.md` | Nenhum |

## O que NÃO vou mexer

- Categorias em `health_conditions` (a tabela `category = 'Cardiovascular'` continua válida — categoria é categoria, doença é doença).
- Filtros de UI que listam categorias (ex: `NutraceuticalSearchFilters`).
- Rótulos de gráficos agrupados por sistema (ex: "Eventos Cardiovasculares" no Stanford demo — ali é eixo agregador, faz sentido).
