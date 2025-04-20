
export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  ownerId: string;
  imageUrl?: string;
  chipNumber?: string;
  petLovePlan?: string;
  veterinarianId?: string;
  veterinarianName?: string;
  reviewDays?: number;
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface ExamResult {
  id: string;
  petId: string;
  date: string;
  type: string;
  results: Record<string, any>;
  notes: string;
}

export interface Nutraceutical {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  dosage: string;
  contraindications: string[];
  source: string; // Origem natural da substância
  chemicalCompound: string; // Composto químico principal
  condition: string;
  activeIngredients: string[]; // Lista de princípios ativos do nutracêutico
  scientificEvidence: {
    efficacyScore: number;
    sustainabilityScore: number;
    studies: Array<{
      title: string;
      link: string;
      year: number;
    }>;
  };
}

export interface Formulation {
  id: string;
  name: string;
  description: string;
  nutraceuticals: string[]; // IDs dos nutracêuticos que compõem a formulação
  targetCondition: string;
  dosage: string;
  contraindications: string[];
}

export interface Recommendation {
  id: string;
  petId: string;
  nutraceuticalId: string;
  reason: string;
  dosage: string;
  duration: string;
  startDate: string;
  priority: number;
}

export interface TreatmentPlan {
  id: string;
  petId: string;
  veterinarianId: string;
  createdAt: string;
  recommendations: Recommendation[];
  notes: string;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
