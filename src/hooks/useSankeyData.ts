
import { useMemo } from 'react';
import { useNutraceuticalContext } from '@/contexts/NutraceuticalContext';
import { SankeyData } from '@/components/administrador/visualizations/sankey/types';

export const useSankeyData = () => {
  const { nutraceuticals, conditions, isLoading } = useNutraceuticalContext();

  const sankeyData = useMemo((): SankeyData => {
    if (!nutraceuticals || !conditions) {
      return { nodes: [], links: [] };
    }

    console.log('Processando dados do Sankey:', { 
      nutraceuticals: nutraceuticals.length, 
      conditions: conditions.length 
    });

    // Criar nós para nutracêuticos
    const nutraceuticalNodes = nutraceuticals.map((nutra: any) => ({
      name: nutra.name,
      category: 'nutraceutico',
      description: nutra.description || `Nutracêutico: ${nutra.name}`
    }));

    // Criar nós para condições
    const conditionNodes = conditions.map((cond: any) => ({
      name: cond.name,
      category: 'condicao',
      description: cond.description || `Condição: ${cond.name}`
    }));

    const nodes = [...nutraceuticalNodes, ...conditionNodes];

    // Criar links baseados nas relações
    const links = [];
    
    for (let nutraIndex = 0; nutraIndex < nutraceuticals.length; nutraIndex++) {
      const nutraceutical = nutraceuticals[nutraIndex];
      const healthConditions = nutraceutical.healthConditions || [];
      
      for (const relation of healthConditions) {
        const conditionIndex = conditions.findIndex(
          (cond: any) => cond.id === relation.condition?.id
        );
        
        if (conditionIndex !== -1) {
          const efficacyScore = relation.efficacy_score || 0;
          const studyCount = nutraceutical.studies?.length || 0;
          
          // Usar a escala 0-5 original para cálculos
          const normalizedValue = (efficacyScore / 5) * 100; // Para visualização
          
          links.push({
            source: nutraIndex,
            target: nutraceuticals.length + conditionIndex,
            value: normalizedValue,
            labelText: efficacyScore >= 4 ? 'Alta eficácia' : 
                      efficacyScore >= 3 ? 'Eficácia moderada' : 'Eficácia baixa',
            studyCount,
            evidenceLevel: efficacyScore,
            description: relation.notes || `Eficácia: ${efficacyScore}/5`,
            sourceName: nutraceutical.name,
            targetName: relation.condition?.name || 'Condição'
          });
        }
      }
    }

    console.log(`Criados ${links.length} links no Sankey`);

    return { nodes, links };
  }, [nutraceuticals, conditions]);

  return {
    sankeyData,
    isLoading
  };
};
