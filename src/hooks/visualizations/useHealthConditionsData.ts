
import { useState, useEffect, useMemo } from 'react';

// Dados simulados para condições de saúde
const mockConditions = [
  {
    id: 'c1',
    name: 'Artrite',
    description: 'Inflamação das articulações, causando dor, inchaço e rigidez. Comum em pets mais velhos e determinadas raças.',
    treatabilityScore: 85,
    preventionScore: 92,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Golden Retriever', 'Labrador', 'Pastor Alemão', 'Siamês'],
    recommendedPackages: 5
  },
  {
    id: 'c2',
    name: 'Dermatite Atópica',
    description: 'Condição inflamatória crônica da pele associada a alergias ambientais, causando coceira intensa.',
    treatabilityScore: 78,
    preventionScore: 65,
    speciesAffected: ['Cães'],
    breedsAffected: ['Bulldog Francês', 'Labrador', 'Shih Tzu', 'West Highland Terrier'],
    recommendedPackages: 4
  },
  {
    id: 'c3',
    name: 'Problemas Digestivos',
    description: 'Inclui diarreias, vômitos, constipação e síndrome do intestino irritável, afetando a digestão e absorção de nutrientes.',
    treatabilityScore: 82,
    preventionScore: 88,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Dachshund', 'Poodle', 'Siamês'],
    recommendedPackages: 6
  },
  {
    id: 'c4',
    name: 'Problemas Cardíacos',
    description: 'Doenças do músculo cardíaco ou valvulares, podendo causar insuficiência cardíaca com o tempo.',
    treatabilityScore: 62,
    preventionScore: 75,
    speciesAffected: ['Cães'],
    breedsAffected: ['Cavalier King Charles Spaniel', 'Doberman', 'Boxer'],
    recommendedPackages: 3
  },
  {
    id: 'c5',
    name: 'Doença Renal Crônica',
    description: 'Perda gradual da função renal que pode se desenvolver ao longo de meses ou anos.',
    treatabilityScore: 58,
    preventionScore: 68,
    speciesAffected: ['Gatos', 'Cães'],
    breedsAffected: ['Persian', 'Maine Coon', 'Pastor Alemão'],
    recommendedPackages: 3
  },
  {
    id: 'c6',
    name: 'Problemas Dentários',
    description: 'Inclui gengivite, periodontite e acúmulo de tártaro, podendo levar a perda dentária e infecções.',
    treatabilityScore: 80,
    preventionScore: 95,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Yorkshire', 'Chihuahua', 'Persa', 'Maltês'],
    recommendedPackages: 2
  },
  {
    id: 'c7',
    name: 'Obesidade',
    description: 'Acúmulo excessivo de gordura corporal, levando a várias complicações de saúde e redução da qualidade de vida.',
    treatabilityScore: 90,
    preventionScore: 98,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Labrador', 'Beagle', 'Pug', 'British Shorthair'],
    recommendedPackages: 4
  },
  {
    id: 'c8',
    name: 'Ansiedade',
    description: 'Desordem comportamental manifestada por medo excessivo, inquietação e comportamentos destrutivos.',
    treatabilityScore: 72,
    preventionScore: 75,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Border Collie', 'Pastor Alemão', 'Siamês'],
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
        if (treatabilityLevel === 'high' && condition.treatabilityScore < 75) {
          return false;
        } else if (treatabilityLevel === 'medium' && (condition.treatabilityScore < 50 || condition.treatabilityScore >= 75)) {
          return false;
        } else if (treatabilityLevel === 'low' && condition.treatabilityScore >= 50) {
          return false;
        }
      }
      
      return true;
    });
  }, [conditions, searchTerm, species, breed, treatabilityLevel]);
  
  // Cálculo de estatísticas
  const stats = useMemo(() => {
    const highTreat = conditions.filter(c => c.treatabilityScore >= 75).length;
    const highPrev = conditions.filter(c => c.preventionScore >= 75).length;
    
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
