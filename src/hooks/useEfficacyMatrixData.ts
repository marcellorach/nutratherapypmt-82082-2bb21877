
import { useState, useEffect, useMemo } from 'react';
import { useNutraceuticalContext } from '@/contexts/NutraceuticalContext';

interface EfficacyMatrixData {
  nutraceuticos: Array<{
    id: number;
    name: string;
    description?: string;
    category: 'nutraceutico';
  }>;
  condicoes: Array<{
    id: number;
    name: string;
    description?: string;
    category: 'condicao';
  }>;
  cells: Array<{
    nutraceuticoId: number;
    condicaoId: number;
    efficacyScore: number;
    evidenceLevel: string;
    studyCount: number;
    description?: string;
  }>;
}

export const useEfficacyMatrixData = () => {
  const { nutraceuticals, conditions, isLoading } = useNutraceuticalContext();
  const [matrixData, setMatrixData] = useState<EfficacyMatrixData | null>(null);

  const processedData = useMemo(() => {
    if (!nutraceuticals || !conditions) return null;

    // Mapear nutracêuticos para o formato da matriz
    const nutraceuticos = nutraceuticals.map((nutra: any, index: number) => ({
      id: index,
      name: nutra.name,
      description: nutra.description,
      category: 'nutraceutico' as const
    }));

    // Mapear condições para o formato da matriz
    const condicoes = conditions.map((cond: any, index: number) => ({
      id: index + nutraceuticos.length,
      name: cond.name,
      description: cond.description,
      category: 'condicao' as const
    }));

    // Processar relações para criar células da matriz
    const cells = [];
    
    for (let i = 0; i < nutraceuticals.length; i++) {
      const nutraceutical = nutraceuticals[i];
      
      // Verificar se há relações com condições
      const healthConditions = nutraceutical.nutraceutical_health_conditions || [];
      
      for (const relation of healthConditions) {
        const conditionIndex = conditions.findIndex(
          (cond: any) => cond.id === relation.condition?.id
        );
        
        if (conditionIndex !== -1) {
          const efficacyScore = relation.efficacy_score || 0;
          const studyCount = nutraceutical.nutraceutical_studies?.length || 0;
          
          cells.push({
            nutraceuticoId: i,
            condicaoId: conditionIndex + nutraceuticos.length,
            efficacyScore: efficacyScore * 20, // Converter para escala 0-100
            evidenceLevel: efficacyScore >= 4 ? '4.0' : efficacyScore >= 3 ? '3.0' : '2.0',
            studyCount,
            description: relation.notes || `Eficácia: ${efficacyScore}/5`
          });
        }
      }
    }

    return {
      nutraceuticos,
      condicoes,
      cells
    };
  }, [nutraceuticals, conditions]);

  useEffect(() => {
    if (processedData) {
      setMatrixData(processedData);
    }
  }, [processedData]);

  return {
    matrixData,
    isLoading,
    nutraceuticals,
    conditions
  };
};
