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
  },
  {
    id: "own3",
    name: "Pedro Santos",
    email: "pedro@email.com",
    phone: "(11) 77777-7777"
  },
  {
    id: "own4",
    name: "Ana Oliveira",
    email: "ana@email.com",
    phone: "(11) 66666-6666"
  },
  {
    id: "own5",
    name: "Carlos Mendes",
    email: "carlos@email.com",
    phone: "(11) 55555-5555"
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
    ownerId: "own1",
    imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2274&q=80",
    chipNumber: "BR12345678",
    petLovePlan: "Premium",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 2
  },
  {
    id: "pet2",
    name: "Luna",
    species: "Cachorro",
    breed: "Poodle",
    age: 3,
    weight: 8,
    ownerId: "own2",
    imageUrl: "https://images.unsplash.com/photo-1594922009922-d1665a492c40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
    chipNumber: "BR87654321",
    petLovePlan: "Básico",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 0
  },
  {
    id: "pet3",
    name: "Felix",
    species: "Gato",
    breed: "Siamês",
    age: 7,
    weight: 4.5,
    ownerId: "own1",
    imageUrl: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    chipNumber: "BR45678912",
    petLovePlan: "Completo",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 1
  },
  {
    id: "pet4",
    name: "Thor",
    species: "Cachorro",
    breed: "Golden Retriever",
    age: 4,
    weight: 28,
    ownerId: "own3",
    imageUrl: "https://images.unsplash.com/photo-1600077106724-946750eeaf3c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1780&q=80",
    chipNumber: "BR98765432",
    petLovePlan: "Premium",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 5
  },
  {
    id: "pet5",
    name: "Nina",
    species: "Gato",
    breed: "Persa",
    age: 2,
    weight: 3.5,
    ownerId: "own4",
    imageUrl: "https://images.unsplash.com/photo-1618189063538-57c32be35883?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    chipNumber: "BR23456789",
    petLovePlan: "Básico",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 3
  },
  {
    id: "pet6",
    name: "Bidu",
    species: "Cachorro",
    breed: "Beagle",
    age: 6,
    weight: 12,
    ownerId: "own5",
    imageUrl: "https://images.unsplash.com/photo-1568572933382-74d440642117?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    chipNumber: "BR34567890",
    petLovePlan: "Completo",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 7
  },
  {
    id: "pet7",
    name: "Mel",
    species: "Cachorro",
    breed: "Shih Tzu",
    age: 2,
    weight: 5.5,
    ownerId: "own4",
    imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1964&q=80",
    chipNumber: "BR56789012",
    petLovePlan: "Premium",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 4
  },
  {
    id: "pet8",
    name: "Tobby",
    species: "Cachorro",
    breed: "Bulldog",
    age: 3,
    weight: 22,
    ownerId: "own3",
    imageUrl: "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1976&q=80",
    chipNumber: "BR67890123",
    petLovePlan: "Básico",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 0
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
