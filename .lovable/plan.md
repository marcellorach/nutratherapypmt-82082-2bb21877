

# Projeção de Melhora Baseada em Evidências Reais

## Problema Atual

A projeção de melhora usa `Math.random()` para gerar `baselineScore`, `projectedImprovement` e `confidenceBand` — valores completamente fictícios. A curva sigmoid é genérica e não reflete a realidade clínica.

## Solução: Motor de Projeção Evidence-Based com 3 Camadas

### Camada 1 — Dados do Knowledge Graph (prioridade máxima)

Para cada condição do paciente, consultar os triplets aprovados (`triplet_extractions`) que já estão disponíveis na pipeline:

- **Contar triplets TREATS/AMELIORATES/PREVENTS** por condição
- **Extrair `intensity` média** (0-1) dos triplets com evidence_level (meta_analysis > rct > observational > in_vitro)
- **Ponderar por `extraction_confidence`** e `evidence_level`
- **Calcular `projectedImprovement`** = intensidade média × peso do nível de evidência × fator de compostos sinérgicos

Fórmula de confiança:
```text
confidence = (n_triplets × weight_evidence_level × avg_confidence) / normalization_factor

evidence_weight: meta_analysis=1.0, rct=0.85, observational=0.6, in_vitro=0.35, null=0.2
```

### Camada 2 — Fallback LLM (quando KG insuficiente)

Se < 3 triplets aprovados para uma condição, invocar a edge function `hybrid-recommendation` (já existente) para obter estimativas baseadas em literatura, marcando claramente como "AI-assisted projection".

### Camada 3 — Metadados de Transparência

Cada projeção retorna:
```typescript
interface EvidenceBasedProjection {
  condition: string;
  baselineScore: number;        // derivado da severidade + predisposição
  projectedImprovement: number; // calculado, não random
  confidenceBand: number;       // derivado da variância dos dados
  // NOVOS CAMPOS:
  dataSource: 'knowledge_graph' | 'hybrid_kg_llm' | 'llm_only';
  confidenceLevel: 'high' | 'medium' | 'low' | 'insufficient';
  evidenceSummary: {
    tripletCount: number;
    studyCount: number;
    dominantEvidenceLevel: string;
    compoundsInvolved: string[];
    avgIntensity: number | null;
  };
  studyGaps?: string;  // sugestão de mais estudos se dados insuficientes
}
```

### O que muda em cada arquivo

| Arquivo | Mudança |
|---------|---------|
| `src/services/clinical-analysis-pipeline.ts` | Reescrever `projections` (linhas 485-493) com motor evidence-based que consulta `triplet_extractions` via Supabase |
| `src/components/pet/ImprovementProjectionChart.tsx` | Adicionar badge de fonte de dados (KG/Hybrid/LLM), indicador de confiança, tooltip com evidenceSummary, e alerta de "estudos recomendados" quando dados insuficientes |
| `src/i18n.ts` + locales PT/EN | Novas chaves para labels de transparência |
| `CHANGELOG.md` | Registrar mudança |

### Regra do Baseline

Em vez de `30 + Math.random() * 20`, o baseline será derivado de:
- Severidade da condição (se disponível no perfil do pet)
- Risk factor da predisposição da raça (já disponível via `breed_predispositions`)
- Default conservador de 40% se sem dados

### Regra da Curva

A curva sigmoid continua, mas os parâmetros são calibrados pelos dados reais:
- **Taxa de resposta** (steepness) = f(evidence_level, intensity)
- **Plateau** = projectedImprovement calculado
- **Banda de confiança** = desvio padrão das confidences dos triplets × 1.5

### Indicadores Visuais no Gráfico

- Badge colorido: verde "Evidência KG" / amarelo "KG + IA" / vermelho "Apenas IA"
- Tooltip expandido mostrando: N triplets, N estudos, compostos, nível de evidência
- Alerta inferior: "Para aumentar a confiança desta projeção, considere curar estudos sobre [condição X]" quando < 3 triplets

### Impacto Zero em Funcionalidades Existentes

- A pipeline clínica continua retornando `projections` no mesmo formato (campos existentes mantidos)
- Campos novos são adicionais — o chart renderiza mesmo sem eles
- Nenhuma outra tab/componente é afetada

