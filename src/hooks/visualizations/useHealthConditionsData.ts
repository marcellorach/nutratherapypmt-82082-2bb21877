
import { useState, useEffect, useMemo } from 'react';

// Dados simulados para condições de saúde com valores de tratabilidade mais realistas
const mockConditions = [
  {
    id: 'c1',
    name: 'Artrite',
    description: 'Inflamação das articulações, causando dor, inchaço e rigidez. Comum em pets mais velhos e determinadas raças.',
    treatabilityScore: 48,
    preventionScore: 55,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Golden Retriever', 'Labrador', 'Pastor Alemão', 'Siamês'],
    recommendedPackages: 3
  },
  {
    id: 'c2',
    name: 'Dermatite Atópica',
    description: 'Condição inflamatória crônica da pele associada a alergias ambientais, causando coceira intensa.',
    treatabilityScore: 52,
    preventionScore: 45,
    speciesAffected: ['Cães'],
    breedsAffected: ['Bulldog Francês', 'Labrador', 'Shih Tzu', 'West Highland Terrier'],
    recommendedPackages: 2
  },
  {
    id: 'c3',
    name: 'Problemas Digestivos',
    description: 'Inclui diarreias, vômitos, constipação e síndrome do intestino irritável, afetando a digestão e absorção de nutrientes.',
    treatabilityScore: 40,
    preventionScore: 65,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Dachshund', 'Poodle', 'Siamês'],
    recommendedPackages: 3
  },
  {
    id: 'c4',
    name: 'Problemas Cardíacos',
    description: 'Doenças do músculo cardíaco ou valvulares, podendo causar insuficiência cardíaca com o tempo.',
    treatabilityScore: 32,
    preventionScore: 48,
    speciesAffected: ['Cães'],
    breedsAffected: ['Cavalier King Charles Spaniel', 'Doberman', 'Boxer'],
    recommendedPackages: 2
  },
  {
    id: 'c5',
    name: 'Doença Renal Crônica',
    description: 'Perda gradual da função renal que pode se desenvolver ao longo de meses ou anos.',
    treatabilityScore: 28,
    preventionScore: 42,
    speciesAffected: ['Gatos', 'Cães'],
    breedsAffected: ['Persian', 'Maine Coon', 'Pastor Alemão'],
    recommendedPackages: 2
  },
  {
    id: 'c6',
    name: 'Problemas Dentários',
    description: 'Inclui gengivite, periodontite e acúmulo de tártaro, podendo levar a perda dentária e infecções.',
    treatabilityScore: 45,
    preventionScore: 78,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Yorkshire', 'Chihuahua', 'Persa', 'Maltês'],
    recommendedPackages: 2
  },
  {
    id: 'c7',
    name: 'Obesidade',
    description: 'Acúmulo excessivo de gordura corporal, levando a várias complicações de saúde e redução da qualidade de vida.',
    treatabilityScore: 55,
    preventionScore: 80,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Labrador', 'Beagle', 'Pug', 'British Shorthair'],
    recommendedPackages: 3
  },
  {
    id: 'c8',
    name: 'Ansiedade',
    description: 'Desordem comportamental manifestada por medo excessivo, inquietação e comportamentos destrutivos.',
    treatabilityScore: 38,
    preventionScore: 52,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Border Collie', 'Pastor Alemão', 'Siamês'],
    recommendedPackages: 2
  },
  // Novas condições relacionadas à longevidade
  {
    id: 'c9',
    name: 'Senescência Celular',
    description: 'Acúmulo de células senescentes que não realizam sua função normal e secretam substâncias inflamatórias, acelerando o envelhecimento.',
    treatabilityScore: 35,
    preventionScore: 60,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Todas as raças'],
    recommendedPackages: 4
  },
  {
    id: 'c10',
    name: 'Mortalidade Geral',
    description: 'Risco de mortalidade por todas as causas, frequentemente associado a fatores como inflamação crônica, estresse oxidativo e disfunção mitocondrial.',
    treatabilityScore: 22,
    preventionScore: 45,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Todas as raças'],
    recommendedPackages: 4
  },
  {
    id: 'c11',
    name: 'Estresse Oxidativo',
    description: 'Desequilíbrio entre radicais livres e antioxidantes no organismo, causando danos celulares e contribuindo para o envelhecimento acelerado.',
    treatabilityScore: 42,
    preventionScore: 68,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Todas as raças'],
    recommendedPackages: 3
  },
  {
    id: 'c12',
    name: 'Disfunção Mitocondrial',
    description: 'Comprometimento da função das mitocôndrias, organelas responsáveis pela produção de energia celular, impactando na saúde geral e longevidade.',
    treatabilityScore: 30,
    preventionScore: 52,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Todas as raças', 'Raças grandes especialmente afetadas'],
    recommendedPackages: 3
  }
];

interface UseHealthConditionsDataProps {
  searchTerm?: string;
  species?: string;
  breed?: string;
  treatabilityLevel?: string;
}

export const useHealthConditionsData = ({
  searchTerm = '',
  species = 'all',
  breed = 'all',
  treatabilityLevel = 'all'
}: UseHealthConditionsDataProps) => {
  const [conditions, setConditions] = useState(mockConditions);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulando carregamento de dados
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Filtragem de dados
  const filteredConditions = useMemo(() => {
    return conditions.filter(condition => {
      // Filtro por termo de busca
      if (searchTerm && !condition.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtro por espécie
      if (species !== 'all') {
        const speciesMap: Record<string, string[]> = {
          'canine': ['Cães'],
          'feline': ['Gatos']
        };
        
        const targetSpecies = speciesMap[species] || [];
        
        if (!condition.speciesAffected.some(s => targetSpecies.includes(s))) {
          return false;
        }
      }
      
      // Filtro por raça
      if (breed !== 'all' && !condition.breedsAffected.some(b => b.toLowerCase().includes(breed.toLowerCase()))) {
        return false;
      }
      
      // Filtro por nível de tratabilidade
      if (treatabilityLevel !== 'all') {
        if (treatabilityLevel === 'high' && condition.treatabilityScore < 45) {
          return false;
        } else if (treatabilityLevel === 'medium' && (condition.treatabilityScore < 30 || condition.treatabilityScore >= 45)) {
          return false;
        } else if (treatabilityLevel === 'low' && condition.treatabilityScore >= 30) {
          return false;
        }
      }
      
      return true;
    });
  }, [conditions, searchTerm, species, breed, treatabilityLevel]);
  
  // Cálculo de estatísticas ajustadas para valores mais realistas
  const stats = useMemo(() => {
    const highTreat = conditions.filter(c => c.treatabilityScore >= 45).length;
    const highPrev = conditions.filter(c => c.preventionScore >= 65).length;
    
    const avgTreatability = Math.round(
      conditions.reduce((acc, curr) => acc + curr.treatabilityScore, 0) / conditions.length
    );
    
    const avgPrevention = Math.round(
      conditions.reduce((acc, curr) => acc + curr.preventionScore, 0) / conditions.length
    );
    
    return {
      totalConditions: conditions.length,
      highTreatability: highTreat,
      highPrevention: highPrev,
      averageTreatability: avgTreatability,
      averagePrevention: avgPrevention
    };
  }, [conditions]);
  
  return {
    conditions,
    filteredConditions,
    isLoading,
    stats
  };
};

