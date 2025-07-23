
import { useMemo } from 'react';
import { useNutraceuticalContext } from '@/contexts/NutraceuticalContext';

export const useNetworkData = () => {
  const { nutraceuticals, conditions, isLoading } = useNutraceuticalContext();

  const networkData = useMemo(() => {
    if (!nutraceuticals || !conditions) {
      return { nodes: [], links: [] };
    }

    console.log('Processando dados do Network:', { 
      nutraceuticals: nutraceuticals.length, 
      conditions: conditions.length 
    });

    // Criar nós para nutracêuticos
    const nutraceuticalNodes = nutraceuticals.map((nutra: any, index: number) => ({
      id: `nutra_${index}`,
      label: nutra.name,
      title: nutra.description || `Nutracêutico: ${nutra.name}`,
      group: 'nutraceutico',
      value: 15,
      shape: 'dot',
      color: {
        background: '#3b82f6',
        border: '#2563eb',
        highlight: {
          background: '#60a5fa',
          border: '#3b82f6'
        }
      }
    }));

    // Criar nós para condições
    const conditionNodes = conditions.map((cond: any, index: number) => ({
      id: `cond_${index}`,
      label: cond.name,
      title: cond.description || `Condição: ${cond.name}`,
      group: 'condicao',
      value: 10,
      shape: 'diamond',
      color: {
        background: '#10b981',
        border: '#059669',
        highlight: {
          background: '#34d399',
          border: '#10b981'
        }
      }
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
          
          links.push({
            id: `link_${nutraIndex}_${conditionIndex}`,
            from: `nutra_${nutraIndex}`,
            to: `cond_${conditionIndex}`,
            title: `Eficácia: ${efficacyScore}/5 - ${efficacyScore >= 4 ? 'Alta' : efficacyScore >= 3 ? 'Moderada' : 'Baixa'}`,
            value: efficacyScore,
            width: Math.max(2, (efficacyScore / 5) * 7),
            label: efficacyScore.toString(),
            color: efficacyScore >= 4 ? '#10b981' : 
                   efficacyScore >= 3 ? '#3b82f6' : 
                   efficacyScore >= 2 ? '#f59e0b' : '#9ca3af',
            arrows: {
              to: {
                enabled: true,
                scaleFactor: 0.5
              }
            }
          });
        }
      }
    }

    console.log(`Criados ${links.length} links no Network`);

    return { nodes, links };
  }, [nutraceuticals, conditions]);

  return {
    networkData,
    isLoading
  };
};
