
import { useState, useEffect, useMemo } from 'react';

// Dados simulados para condições de saúde com valores de tratabilidade mais realistas
const mockConditions = [
  {
    id: 'c1',
    name: 'Artrite',
    description: 'Inflamação das articulações, causando dor, inchaço e rigidez. Comum em pets mais velhos e determinadas raças.',
    treatabilityScore: 48,
    preventionScore: 55,
    roi: 2.3,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Golden Retriever', 'Labrador', 'Pastor Alemão', 'Siamês'],
    recommendedPackages: 3,
    eligibleDogs: 24500,
    eligibleCats: 12300
  },
  {
    id: 'c2',
    name: 'Dermatite Atópica',
    description: 'Condição inflamatória crônica da pele associada a alergias ambientais, causando coceira intensa.',
    treatabilityScore: 52,
    preventionScore: 45,
    roi: 1.5,
    speciesAffected: ['Cães'],
    breedsAffected: ['Bulldog Francês', 'Labrador', 'Shih Tzu', 'West Highland Terrier'],
    recommendedPackages: 2,
    eligibleDogs: 28100,
    eligibleCats: 0
  },
  {
    id: 'c3',
    name: 'Problemas Digestivos',
    description: 'Inclui diarreias, vômitos, constipação e síndrome do intestino irritável, afetando a digestão e absorção de nutrientes.',
    treatabilityScore: 40,
    preventionScore: 65,
    roi: 3.1,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Dachshund', 'Poodle', 'Siamês'],
    recommendedPackages: 3,
    eligibleDogs: 18750,
    eligibleCats: 14200
  },
  {
    id: 'c4',
    name: 'Problemas Cardíacos',
    description: 'Doenças do músculo cardíaco ou valvulares, podendo causar insuficiência cardíaca com o tempo.',
    treatabilityScore: 32,
    preventionScore: 48,
    roi: -0.7,
    speciesAffected: ['Cães'],
    breedsAffected: ['Cavalier King Charles Spaniel', 'Doberman', 'Boxer'],
    recommendedPackages: 2,
    eligibleDogs: 15600,
    eligibleCats: 0
  },
  {
    id: 'c5',
    name: 'Doença Renal Crônica',
    description: 'Perda gradual da função renal que pode se desenvolver ao longo de meses ou anos.',
    treatabilityScore: 28,
    preventionScore: 42,
    roi: -1.2,
    speciesAffected: ['Gatos', 'Cães'],
    breedsAffected: ['Persian', 'Maine Coon', 'Pastor Alemão'],
    recommendedPackages: 2,
    eligibleDogs: 8900,
    eligibleCats: 19400
  },
  {
    id: 'c6',
    name: 'Problemas Dentários',
    description: 'Inclui gengivite, periodontite e acúmulo de tártaro, podendo levar a perda dentária e infecções.',
    treatabilityScore: 45,
    preventionScore: 78,
    roi: 2.8,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Yorkshire', 'Chihuahua', 'Persa', 'Maltês'],
    recommendedPackages: 2,
    eligibleDogs: 21300,
    eligibleCats: 16800
  },
  {
    id: 'c7',
    name: 'Obesidade',
    description: 'Acúmulo excessivo de gordura corporal, levando a várias complicações de saúde e redução da qualidade de vida.',
    treatabilityScore: 55,
    preventionScore: 80,
    roi: 3.4,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Labrador', 'Beagle', 'Pug', 'British Shorthair'],
    recommendedPackages: 3,
    eligibleDogs: 32450,
    eligibleCats: 18200
  },
  {
    id: 'c8',
    name: 'Ansiedade',
    description: 'Desordem comportamental manifestada por medo excessivo, inquietação e comportamentos destrutivos.',
    treatabilityScore: 38,
    preventionScore: 52,
    roi: 0.9,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Border Collie', 'Pastor Alemão', 'Siamês'],
    recommendedPackages: 2,
    eligibleDogs: 19200,
    eligibleCats: 11500
  },
  // Novas condições relacionadas à longevidade
  {
    id: 'c9',
    name: 'Senescência Celular',
    description: 'Acúmulo de células senescentes que não realizam sua função normal e secretam substâncias inflamatórias, acelerando o envelhecimento.',
    treatabilityScore: 35,
    preventionScore: 60,
    roi: 1.8,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Todas as raças'],
    recommendedPackages: 4,
    eligibleDogs: 38000,
    eligibleCats: 22000
  },
  {
    id: 'c10',
    name: 'Mortalidade Geral',
    description: 'Risco de mortalidade por todas as causas, frequentemente associado a fatores como inflamação crônica, estresse oxidativo e disfunção mitocondrial.',
    treatabilityScore: 22,
    preventionScore: 45,
    roi: -0.5,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Todas as raças'],
    recommendedPackages: 4,
    eligibleDogs: 42000,
    eligibleCats: 25000
  },
  {
    id: 'c11',
    name: 'Estresse Oxidativo',
    description: 'Desequilíbrio entre radicais livres e antioxidantes no organismo, causando danos celulares e contribuindo para o envelhecimento acelerado.',
    treatabilityScore: 42,
    preventionScore: 68,
    roi: 2.1,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Todas as raças'],
    recommendedPackages: 3,
    eligibleDogs: 35500,
    eligibleCats: 20800
  },
  {
    id: 'c12',
    name: 'Disfunção Mitocondrial',
    description: 'Comprometimento da função das mitocôndrias, organelas responsáveis pela produção de energia celular, impactando na saúde geral e longevidade.',
    treatabilityScore: 30,
    preventionScore: 52,
    roi: 0.3,
    speciesAffected: ['Cães', 'Gatos'],
    breedsAffected: ['Todas as raças', 'Raças grandes especialmente afetadas'],
    recommendedPackages: 3,
    eligibleDogs: 29800,
    eligibleCats: 17300
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
    
    // Calcular total de animais elegíveis (únicos)
    const totalEligibleDogs = conditions.reduce((acc, curr) => acc + (curr.eligibleDogs || 0), 0);
    const totalEligibleCats = conditions.reduce((acc, curr) => acc + (curr.eligibleCats || 0), 0);
    const totalEligibleAnimals = totalEligibleDogs + totalEligibleCats;
    
    // Total de tratamentos elegíveis (considerando que um animal pode ter múltiplos tratamentos)
    // Aproximadamente 2.2x o número de animais
    const totalEligibleTreatments = Math.round(totalEligibleAnimals * 2.2);
    
    return {
      totalConditions: conditions.length,
      highTreatability: highTreat,
      highPrevention: highPrev,
      averageTreatability: avgTreatability,
      averagePrevention: avgPrevention,
      totalEligibleAnimals,
      totalEligibleTreatments,
      totalEligibleDogs,
      totalEligibleCats
    };
  }, [conditions]);
  
  return {
    conditions,
    filteredConditions,
    isLoading,
    stats
  };
};
