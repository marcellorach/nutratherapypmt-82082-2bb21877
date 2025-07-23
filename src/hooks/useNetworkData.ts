
import { useMemo } from 'react';
import { useNutraceuticalContext } from '@/contexts/NutraceuticalContext';
import { useStudies } from '@/hooks/nutraceuticals/useStudies';

export const useNetworkData = () => {
  const { nutraceuticals, conditions, isLoading } = useNutraceuticalContext();
  const { studies, isLoading: studiesLoading } = useStudies();

  const networkData = useMemo(() => {
    if (!nutraceuticals || !conditions) {
      return { nodes: [], links: [] };
    }

    console.log('Processando dados do Network:', { 
      nutraceuticals: nutraceuticals.length, 
      conditions: conditions.length,
      studies: studies.length
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

    // Criar nós para estudos científicos
    const studyNodes = studies.map((study: any, index: number) => ({
      id: `study_${index}`,
      label: study.title.length > 30 ? study.title.substring(0, 30) + '...' : study.title,
      title: `Estudo: ${study.title}\nJournal: ${study.journal || 'N/A'}\nAno: ${study.year || 'N/A'}`,
      group: 'study',
      value: 8,
      shape: 'triangle',
      color: {
        background: '#a855f7',
        border: '#9333ea',
        highlight: {
          background: '#c084fc',
          border: '#a855f7'
        }
      }
    }));

    const nodes = [...nutraceuticalNodes, ...conditionNodes, ...studyNodes];

    // Criar links baseados nas relações nutracêutico-condição
    const links = [];
    
    for (let nutraIndex = 0; nutraIndex < nutraceuticals.length; nutraIndex++) {
      const nutraceutical = nutraceuticals[nutraIndex];
      const healthConditions = nutraceutical.healthConditions || [];
      
      for (const condition of healthConditions) {
        const conditionIndex = conditions.findIndex(
          (cond: any) => cond.id === condition.id
        );
        
        if (conditionIndex !== -1) {
          const efficacyScore = condition.efficacyScore || 0;
          
          links.push({
            id: `link_nutra_cond_${nutraIndex}_${conditionIndex}`,
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

      // Criar links para estudos científicos
      const nutraStudies = nutraceutical.studies || [];
      for (const study of nutraStudies) {
        const studyIndex = studies.findIndex(
          (s: any) => s.id === study.id
        );
        
        if (studyIndex !== -1) {
          const relevanceScore = study.relevanceScore || 0;
          
          links.push({
            id: `link_nutra_study_${nutraIndex}_${studyIndex}`,
            from: `nutra_${nutraIndex}`,
            to: `study_${studyIndex}`,
            title: `Relevância: ${relevanceScore}/5`,
            value: relevanceScore,
            width: Math.max(1, (relevanceScore / 5) * 4),
            color: '#a855f7',
            dashes: [3, 3],
            arrows: {
              to: {
                enabled: true,
                scaleFactor: 0.3
              }
            }
          });
        }
      }
    }

    console.log(`Criados ${links.length} links no Network`);
    console.log(`Nós criados: ${nutraceuticalNodes.length} nutracêuticos, ${conditionNodes.length} condições, ${studyNodes.length} estudos`);

    return { nodes, links };
  }, [nutraceuticals, conditions, studies]);

  return {
    networkData,
    isLoading: isLoading || studiesLoading
  };
};
