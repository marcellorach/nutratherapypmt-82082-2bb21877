import { useMemo, useEffect, useState } from "react";
import { CURRENT_SAMPLE_GROUP } from "@/data/sampleGroups";

// Mock data for health conditions with realistic distributions
// Numbers are based on the current sample group (Group J: 3,981 eligible pets)
const mockConditions = [
  {
    id: "1",
    name: "Obesidade",
    description: "Excesso de peso que pode levar a diversos problemas de saúde",
    treatabilityScore: 8.5,
    preventionScore: 9.0,
    roi: 85,
    speciesAffected: ["Cães", "Gatos"],
    breedsAffected: ["Labrador", "Beagle", "Persa", "British Shorthair"],
    recommendedPackages: ["Metabolic Support", "Weight Management"],
    eligibleDogs: 320,
    eligibleCats: 180
  },
  {
    id: "2",
    name: "Artrite",
    description: "Inflamação das articulações que causa dor e rigidez",
    treatabilityScore: 7.8,
    preventionScore: 8.2,
    roi: 78,
    speciesAffected: ["Cães", "Gatos"],
    breedsAffected: ["Golden Retriever", "Pastor Alemão", "Maine Coon"],
    recommendedPackages: ["Joint Support", "Anti-Inflammatory"],
    eligibleDogs: 185,
    eligibleCats: 92
  },
  {
    id: "3",
    name: "Ansiedade",
    description: "Distúrbio comportamental que causa estresse e desconforto",
    treatabilityScore: 7.2,
    preventionScore: 8.5,
    roi: 72,
    speciesAffected: ["Cães", "Gatos"],
    breedsAffected: ["Border Collie", "Chihuahua", "Siamês"],
    recommendedPackages: ["Calming Support", "Behavioral Balance"],
    eligibleDogs: 248,
    eligibleCats: 155
  },
  {
    id: "4",
    name: "Problemas Digestivos",
    description: "Distúrbios gastrointestinais que afetam a digestão e absorção",
    treatabilityScore: 8.0,
    preventionScore: 8.8,
    roi: 80,
    speciesAffected: ["Cães", "Gatos"],
    breedsAffected: ["Boxer", "Yorkshire", "Ragdoll"],
    recommendedPackages: ["Digestive Support", "Probiotic Complex"],
    eligibleDogs: 295,
    eligibleCats: 178
  },
  {
    id: "5",
    name: "Senescência Celular",
    description: "Envelhecimento celular que afeta múltiplos sistemas orgânicos",
    treatabilityScore: 6.8,
    preventionScore: 7.5,
    roi: 68,
    speciesAffected: ["Cães", "Gatos"],
    breedsAffected: ["Todas as raças"],
    recommendedPackages: ["Longevity Protocol", "Cellular Health"],
    eligibleDogs: 290,
    eligibleCats: 168
  },
  {
    id: "6",
    name: "Problemas Cardíacos",
    description: "Condições cardiovasculares que afetam a função do coração",
    treatabilityScore: 7.5,
    preventionScore: 8.3,
    roi: 75,
    speciesAffected: ["Cães", "Gatos"],
    breedsAffected: ["Cavalier King Charles", "Doberman", "Persa"],
    recommendedPackages: ["Cardio Support", "Heart Health"],
    eligibleDogs: 142,
    eligibleCats: 88
  },
  {
    id: "7",
    name: "Problemas Renais",
    description: "Disfunção renal crônica que afeta a filtração e eliminação",
    treatabilityScore: 6.5,
    preventionScore: 7.8,
    roi: 65,
    speciesAffected: ["Cães", "Gatos"],
    breedsAffected: ["Shih Tzu", "Lhasa Apso", "Persa", "Abissínio"],
    recommendedPackages: ["Renal Support", "Kidney Protection"],
    eligibleDogs: 168,
    eligibleCats: 125
  },
  {
    id: "8",
    name: "Alergias Cutâneas",
    description: "Reações alérgicas que afetam a pele e pelagem",
    treatabilityScore: 7.0,
    preventionScore: 8.0,
    roi: 70,
    speciesAffected: ["Cães", "Gatos"],
    breedsAffected: ["Bulldog", "Pug", "Sphynx", "Devon Rex"],
    recommendedPackages: ["Skin Health", "Allergy Support"],
    eligibleDogs: 312,
    eligibleCats: 192
  },
  {
    id: "9",
    name: "Declínio Cognitivo",
    description: "Deterioração das funções mentais relacionada à idade",
    treatabilityScore: 6.2,
    preventionScore: 7.2,
    roi: 62,
    speciesAffected: ["Cães", "Gatos"],
    breedsAffected: ["Todas as raças seniores"],
    recommendedPackages: ["Brain Health", "Cognitive Support"],
    eligibleDogs: 195,
    eligibleCats: 118
  },
  {
    id: "10",
    name: "Doenças Hepáticas",
    description: "Condições que afetam a função e saúde do fígado",
    treatabilityScore: 6.8,
    preventionScore: 7.5,
    roi: 68,
    speciesAffected: ["Cães", "Gatos"],
    breedsAffected: ["Schnauzer", "Cocker Spaniel", "Siamês"],
    recommendedPackages: ["Liver Support", "Detox Protocol"],
    eligibleDogs: 132,
    eligibleCats: 85
  },
  {
    id: "11",
    name: "Estresse Oxidativo",
    description: "Desequilíbrio entre radicais livres e antioxidantes",
    treatabilityScore: 7.8,
    preventionScore: 8.5,
    roi: 78,
    speciesAffected: ["Cães", "Gatos"],
    breedsAffected: ["Todas as raças"],
    recommendedPackages: ["Antioxidant Complex", "Cellular Protection"],
    eligibleDogs: 185,
    eligibleCats: 132
  },
  {
    id: "12",
    name: "Disfunção Mitocondrial",
    description: "Comprometimento da produção energética celular",
    treatabilityScore: 6.5,
    preventionScore: 7.2,
    roi: 65,
    speciesAffected: ["Cães", "Gatos"],
    breedsAffected: ["Todas as raças"],
    recommendedPackages: ["Mitochondrial Support", "Energy Boost"],
    eligibleDogs: 96,
    eligibleCats: 73
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
}: UseHealthConditionsDataProps = {}) => {
  const [conditions, setConditions] = useState(mockConditions);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Filter conditions
  const filteredConditions = useMemo(() => {
    return conditions.filter(condition => {
      // Search filter
      if (searchTerm && !condition.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Species filter
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
      
      // Breed filter
      if (breed !== 'all' && !condition.breedsAffected.some(b => b.toLowerCase().includes(breed.toLowerCase()))) {
        return false;
      }
      
      // Treatability level filter
      if (treatabilityLevel !== 'all') {
        if (treatabilityLevel === 'high' && condition.treatabilityScore < 8.0) {
          return false;
        } else if (treatabilityLevel === 'medium' && (condition.treatabilityScore < 6.5 || condition.treatabilityScore >= 8.0)) {
          return false;
        } else if (treatabilityLevel === 'low' && condition.treatabilityScore >= 6.5) {
          return false;
        }
      }
      
      return true;
    });
  }, [conditions, searchTerm, species, breed, treatabilityLevel]);
  
  // Calculate statistics based on current sample group
  const stats = useMemo(() => {
    const totalConditions = conditions.length;
    const highTreatability = conditions.filter(c => c.treatabilityScore >= 8.0).length;
    const highPrevention = conditions.filter(c => c.preventionScore >= 8.0).length;
    
    const totalTreatability = conditions.reduce((sum, c) => sum + c.treatabilityScore, 0);
    const totalPrevention = conditions.reduce((sum, c) => sum + c.preventionScore, 0);
    
    const averageTreatability = totalTreatability / totalConditions;
    const averagePrevention = totalPrevention / totalConditions;
    
    // Use sample group data for totals
    const totalEligibleDogs = CURRENT_SAMPLE_GROUP.eligibleDogs;
    const totalEligibleCats = CURRENT_SAMPLE_GROUP.eligibleCats;
    const totalEligibleAnimals = CURRENT_SAMPLE_GROUP.eligiblePets;
    
    // Calculate total treatments using the sample group multiplier
    const totalEligibleTreatments = Math.round(
      totalEligibleAnimals * CURRENT_SAMPLE_GROUP.treatmentMultiplier
    );
    
    return {
      totalConditions,
      highTreatability,
      highPrevention,
      averageTreatability,
      averagePrevention,
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
