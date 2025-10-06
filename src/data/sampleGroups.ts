/**
 * Sample Groups Configuration
 * 
 * Defines different batch groups for data analysis demonstrations.
 * Each group represents a cohort of pets being analyzed.
 * 
 * To change the active group, update the CURRENT_SAMPLE_GROUP constant.
 */

export interface SampleGroup {
  id: string;
  name: string;
  totalRecords: number;
  eligiblePets: number;
  eligibleDogs: number;
  eligibleCats: number;
  treatmentMultiplier: number; // Average treatments per eligible pet
  description?: string;
}

export const SAMPLE_GROUPS: Record<string, SampleGroup> = {
  J: {
    id: 'J',
    name: 'Grupo J',
    totalRecords: 5420,
    eligiblePets: 3981,
    eligibleDogs: 2468,
    eligibleCats: 1513,
    treatmentMultiplier: 2.2,
    description: 'Batch de análise principal - demonstração do sistema'
  },
  A: {
    id: 'A',
    name: 'Grupo A',
    totalRecords: 2100,
    eligiblePets: 1520,
    eligibleDogs: 945,
    eligibleCats: 575,
    treatmentMultiplier: 2.2,
    description: 'Grupo de teste menor'
  },
  K: {
    id: 'K',
    name: 'Grupo K',
    totalRecords: 8900,
    eligiblePets: 6432,
    eligibleDogs: 3987,
    eligibleCats: 2445,
    treatmentMultiplier: 2.2,
    description: 'Grupo de análise ampliado'
  }
};

// Change this to switch between groups
export const CURRENT_SAMPLE_GROUP = SAMPLE_GROUPS.J;
