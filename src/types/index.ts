
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

export interface NutraceuticalCondition {
  id?: string;
  name: string;
  efficacyScore: number;  // 0-1: Sem evidência, 1-2: Anedótica, 2-3: Leve, 3-4: Moderada, 4-5: Alta
  relationshipType?: string;
}

export interface Nutraceutical {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  dosage: string;
  contraindications: string[];
  source: string;
  chemicalCompound: string;
  condition: string;
  preventionConditions: NutraceuticalCondition[];
  treatmentConditions: NutraceuticalCondition[];
  supportConditions: NutraceuticalCondition[];
  activeIngredients: string[];
  scientificEvidence: {
    efficacyScore: number;
    sustainabilityScore: number;
    studies: Array<{
      title: string;
      link: string;
      year: number;
    }>;
  };
  healthConditions?: NutraceuticalCondition[];
  studies?: any[];
  outcomeCount?: number;
  studyCount?: number;
  outcome?: any;
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

// Tipos adicionais
export type RelationshipType = 'prevention' | 'treatment' | 'support' | 'primary';

