

# Plano: Diagnóstico Clínico Profundo com Conexões Inter-Condições

## Contexto

A Mel (Golden Retriever, 10 anos) tem 3 condições: CDS, Osteoarthritis, Cellular Senescence. Hoje, elas aparecem como uma lista plana sem relação entre si. O KG já tem dados ricos:
- 15+ nutracêuticos que TREATS Cellular Senescence (Fisetin, Quercetin, Curcumin, EGCG...)
- 20+ que TREATS Osteoarthritis (Resveratrol, Omega-3, Taurine, Vitamin D...)
- 10+ que TREATS CDS (Homotaurine, S-adenosyl-methionine, Apoaequorin, MCT...)
- Relações causais: "Systemic chronic inflammation AGGRAVATES Osteoarthritis", "Oxidative Stress CAUSES DNA Damage", "Mitochondrial Dysfunction LEADS_TO Age-related Illnesses"
- Predicados PREDISPOSED_IN, CAUSES, AGGRAVATES, LEADS_TO já existentes

## O Que Falta

1. **Conexões inter-condições**: Senescência Celular → inflamação crônica → agrava Osteoartrite. Isso existe no KG mas não é exibido.
2. **Condições como cards expandíveis**: Hoje são linhas simples. Cada condição deveria expandir para mostrar tratamentos disponíveis no KG, mecanismos biológicos e relações causais com outras condições do paciente.
3. **Mapa de comorbidades**: Visualização de como as condições se conectam via processos biológicos compartilhados (inflamação, estresse oxidativo, disfunção mitocondrial).
4. **Medicação vs. condição**: Selegiline (CDS) não está linkada visualmente à condição que trata.

## Mudanças Propostas

### 1. Novo componente `ConditionInsightCard`
Substitui a listagem plana de condições. Cada condição vira um card expansível que mostra:
- **Cabeçalho**: Nome + severity + status (como hoje)
- **Expandido**: 
  - Nutracêuticos do KG que TREATS/PREVENTS essa condição (com confidence)
  - Processos biológicos ligados (AGGRAVATES, CAUSES, LEADS_TO)
  - Medicações atuais que endereçam essa condição
  - Conexões com outras condições do paciente (ex: "Senescência Celular → inflamação sistêmica → agrava Osteoartrite")

### 2. Novo componente `ComorbidityMap`
Mini-diagrama mostrando as 3 condições como nós conectados por processos biológicos:
```text
 [Cellular Senescence]
       ↓ CAUSES
 [Systemic Inflammation]
       ↓ AGGRAVATES        ↓ CAUSES
 [Osteoarthritis]    [Cognitive Decline]
```
Dados vêm de uma query ao KG buscando caminhos entre as condições do paciente.

### 3. Edge Function `condition-insights`
Recebe a lista de condições do pet e retorna:
- Para cada condição: top nutracêuticos (TREATS), mecanismos (HAS_MECHANISM), processos causais
- Caminhos inter-condições via processos biológicos compartilhados
- Nutracêuticos que tratam múltiplas condições simultaneamente (interseção)

### 4. Atualizar `PetProfilePage.tsx`
- Substituir a lista plana de condições pelo novo `ConditionInsightCard`
- Adicionar `ComorbidityMap` acima da lista de condições
- Exibir "nutracêuticos sinérgicos" — compostos que cobrem 2+ condições simultaneamente (ex: Resveratrol trata Osteoartrite E Senescência Celular)

## Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/condition-insights/index.ts` | **Criar** — Edge function que consulta `triplet_extractions` para cada condição, encontra TREATS, CAUSES, AGGRAVATES, caminhos inter-condições, e compostos sinérgicos |
| `src/components/pet/ConditionInsightCard.tsx` | **Criar** — Card expansível por condição com tratamentos KG, mecanismos e conexões causais |
| `src/components/pet/ComorbidityMap.tsx` | **Criar** — Diagrama visual de como as condições se interconectam via processos biológicos |
| `src/hooks/useConditionInsights.ts` | **Criar** — Hook que chama a edge function `condition-insights` |
| `src/pages/veterinario/PetProfilePage.tsx` | **Editar** — Substituir lista plana de condições pelos novos componentes |

## Detalhe Técnico: Query do KG

A edge function fará:

```sql
-- Tratamentos para cada condição
SELECT subject_name, predicate, object_name, extraction_confidence
FROM triplet_extractions
WHERE object_name ILIKE $condition
AND predicate IN ('TREATS', 'PREVENTS', 'AMELIORATES')
AND curation_status = 'approved'
ORDER BY extraction_confidence DESC

-- Processos que conectam condições
SELECT subject_name, predicate, object_name
FROM triplet_extractions
WHERE predicate IN ('CAUSES', 'AGGRAVATES', 'LEADS_TO', 'TRIGGERS')
AND curation_status = 'approved'
AND (object_name ILIKE ANY($conditions) OR subject_name ILIKE ANY($conditions))

-- Compostos sinérgicos (tratam 2+ condições)
SELECT subject_name, array_agg(DISTINCT object_name) as conditions_treated
FROM triplet_extractions
WHERE predicate = 'TREATS' AND curation_status = 'approved'
AND object_name ILIKE ANY($conditions)
GROUP BY subject_name
HAVING COUNT(DISTINCT object_name) >= 2
```

Isso gera um mapa clínico rico e real baseado no KG existente (~25k edges), transformando a visão plana em um diagnóstico inteligente e conectado para o veterinário.

