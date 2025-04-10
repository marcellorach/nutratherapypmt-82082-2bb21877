
import { Pet, Owner, ExamResult, Nutraceutical, Recommendation, TreatmentPlan } from "../types";

// Mock Owners
export const owners: Owner[] = [
  {
    id: "own1",
    name: "João Silva",
    email: "joao@email.com",
    phone: "(11) 99999-9999"
  },
  {
    id: "own2",
    name: "Maria Souza",
    email: "maria@email.com",
    phone: "(11) 88888-8888"
  }
];

// Mock Pets
export const pets: Pet[] = [
  {
    id: "pet1",
    name: "Rex",
    species: "Cachorro",
    breed: "Labrador",
    age: 5,
    weight: 25,
    ownerId: "own1"
  },
  {
    id: "pet2",
    name: "Luna",
    species: "Cachorro",
    breed: "Poodle",
    age: 3,
    weight: 8,
    ownerId: "own2"
  },
  {
    id: "pet3",
    name: "Felix",
    species: "Gato",
    breed: "Siamês",
    age: 7,
    weight: 4.5,
    ownerId: "own1"
  }
];

// Mock Exam Results
export const examResults: ExamResult[] = [
  {
    id: "exm1",
    petId: "pet1",
    date: "2025-03-15",
    type: "Sangue",
    results: {
      hemoglobina: 14.5,
      leucócitos: 8500,
      plaquetas: 250000,
      vitamina_d: 25.3,
      cálcio: 8.9,
    },
    notes: "Níveis ligeiramente baixos de vitamina D."
  },
  {
    id: "exm2",
    petId: "pet2",
    date: "2025-04-01",
    type: "Sangue",
    results: {
      hemoglobina: 13.8,
      leucócitos: 9200,
      plaquetas: 200000,
      vitamina_d: 32.0,
      cálcio: 9.5,
    },
    notes: "Resultados normais."
  }
];

// Mock Nutraceuticals
export const nutraceuticals: Nutraceutical[] = [
  {
    id: "nut1",
    name: "OmegaPet Plus",
    description: "Suplemento rico em Ômega 3 e 6 para saúde da pele e pelagem.",
    benefits: ["Melhora saúde da pele", "Reduz inflamação", "Fortalece sistema imunológico"],
    dosage: "1ml por 5kg de peso corporal, diariamente",
    contraindications: ["Alergia a peixes ou frutos do mar"],
    scientificEvidence: {
      score: 4.5,
      studies: ["Journal of Veterinary Medicine, 2023", "Pet Health Research, 2022"]
    }
  },
  {
    id: "nut2",
    name: "ArthriCare",
    description: "Suplemento para saúde articular com glucosamina e condroitina.",
    benefits: ["Melhora mobilidade", "Reduz dor articular", "Protege cartilagens"],
    dosage: "1 tablete para cada 10kg de peso corporal, diariamente",
    contraindications: ["Diabetes não controlada"],
    scientificEvidence: {
      score: 4.2,
      studies: ["Veterinary Orthopaedics International, 2024", "Animal Care Journal, 2023"]
    }
  },
  {
    id: "nut3",
    name: "ImmunoVet",
    description: "Complexo de vitaminas e minerais para fortalecimento imunológico.",
    benefits: ["Fortalece sistema imunológico", "Aumenta energia", "Melhora qualidade de vida"],
    dosage: "5ml diários para pets até 10kg, 10ml para pets acima de 10kg",
    contraindications: ["Hipervitaminose prévia"],
    scientificEvidence: {
      score: 3.8,
      studies: ["Veterinary Immunology, 2022", "Prevention in Small Animals, 2023"]
    }
  }
];

// Mock Recommendations
export const recommendations: Recommendation[] = [
  {
    id: "rec1",
    petId: "pet1",
    nutraceuticalId: "nut1",
    reason: "Pelagem ressecada e dermatite recorrente",
    dosage: "5ml diários",
    duration: "3 meses",
    startDate: "2025-04-15",
    priority: 1
  },
  {
    id: "rec2",
    petId: "pet1",
    nutraceuticalId: "nut3",
    reason: "Fortalecimento do sistema imunológico após infecção recente",
    dosage: "10ml diários",
    duration: "2 meses",
    startDate: "2025-04-15",
    priority: 2
  },
  {
    id: "rec3",
    petId: "pet2",
    nutraceuticalId: "nut2",
    reason: "Prevenção de problemas articulares comuns na raça",
    dosage: "1 tablete diário",
    duration: "Contínuo",
    startDate: "2025-04-10",
    priority: 1
  }
];

// Mock Treatment Plans
export const treatmentPlans: TreatmentPlan[] = [
  {
    id: "pln1",
    petId: "pet1",
    veterinarianId: "vet1",
    createdAt: "2025-04-05",
    recommendations: [
      {
        id: "rec1",
        petId: "pet1",
        nutraceuticalId: "nut1",
        reason: "Pelagem ressecada e dermatite recorrente",
        dosage: "5ml diários",
        duration: "3 meses",
        startDate: "2025-04-15",
        priority: 1
      },
      {
        id: "rec2",
        petId: "pet1",
        nutraceuticalId: "nut3",
        reason: "Fortalecimento do sistema imunológico após infecção recente",
        dosage: "10ml diários",
        duration: "2 meses",
        startDate: "2025-04-15",
        priority: 2
      }
    ],
    notes: "Reavaliar após 1 mês para ajustes na dosagem se necessário."
  },
  {
    id: "pln2",
    petId: "pet2",
    veterinarianId: "vet1",
    createdAt: "2025-04-02",
    recommendations: [
      {
        id: "rec3",
        petId: "pet2",
        nutraceuticalId: "nut2",
        reason: "Prevenção de problemas articulares comuns na raça",
        dosage: "1 tablete diário",
        duration: "Contínuo",
        startDate: "2025-04-10",
        priority: 1
      }
    ],
    notes: "Monitorar mobilidade e disposição do animal."
  }
];

// Função para gerar dados aleatórios de exemplo
export const generateRandomData = () => {
  alert("Dados de exemplo gerados com sucesso!");
  return {
    pets,
    owners,
    examResults,
    nutraceuticals,
    recommendations,
    treatmentPlans
  };
};
