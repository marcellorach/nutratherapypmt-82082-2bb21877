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
  scientificEvidence: {
    score: number;
    studies: string[];
  };
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
