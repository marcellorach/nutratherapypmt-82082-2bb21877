/**
 * Mock Data Generator for Clinical Monitoring System
 * Generates realistic longitudinal data for 12,847 pets in nutritherapy
 */

export interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  conditions: string[];
  treatmentStartDate: Date;
  followUpMonths: number;
  responseStatus: 'significant' | 'mild' | 'none' | 'insufficient';
  adherenceRate: number;
  nutraceuticals: string[];
  region: string;
}

export interface ConditionData {
  id: string;
  name: string;
  name_en: string;
  totalCases: number;
  breedDistribution: { breed: string; percentage: number; count: number }[];
  responseRates: {
    significant: number;
    mild: number;
    none: number;
    insufficient: number;
  };
  commonNutraceuticals: { name: string; usage: number }[];
  averageTimeToImprovement: number; // weeks
  ageDistribution: { range: string; count: number }[];
}

export interface TimelinePoint {
  month: string;
  newPets: number;
  significantResponse: number;
  mildResponse: number;
  noResponse: number;
  dropouts: number;
}

// Realistic breed distribution (50+ breeds)
const BREED_DISTRIBUTION = [
  { name: 'Labrador Retriever', percentage: 11.8 },
  { name: 'Golden Retriever', percentage: 9.3 },
  { name: 'Bulldog', percentage: 7.6 },
  { name: 'Pastor Alemão', percentage: 7.2 },
  { name: 'Poodle', percentage: 6.8 },
  { name: 'Beagle', percentage: 5.4 },
  { name: 'Rottweiler', percentage: 4.9 },
  { name: 'Boxer', percentage: 4.2 },
  { name: 'Dachshund', percentage: 3.8 },
  { name: 'Yorkshire Terrier', percentage: 3.5 },
  { name: 'Shih Tzu', percentage: 3.2 },
  { name: 'Maltês', percentage: 2.9 },
  { name: 'Chihuahua', percentage: 2.6 },
  { name: 'Pug', percentage: 2.4 },
  { name: 'Border Collie', percentage: 2.1 },
  { name: 'Schnauzer', percentage: 1.9 },
  { name: 'Cocker Spaniel', percentage: 1.7 },
  { name: 'Husky Siberiano', percentage: 1.5 },
  { name: 'Doberman', percentage: 1.4 },
  { name: 'Pit Bull', percentage: 1.3 },
  { name: 'Raças Mistas', percentage: 18.4 }
];

// Health conditions with breed predisposition
export const HEALTH_CONDITIONS: ConditionData[] = [
  {
    id: 'arthritis',
    name: 'Artrite Canina',
    name_en: 'Canine Arthritis',
    totalCases: 2847,
    breedDistribution: [
      { breed: 'Labrador Retriever', percentage: 34, count: 968 },
      { breed: 'Golden Retriever', percentage: 28, count: 797 },
      { breed: 'Pastor Alemão', percentage: 18, count: 512 },
      { breed: 'Rottweiler', percentage: 12, count: 342 },
      { breed: 'Outros', percentage: 8, count: 228 }
    ],
    responseRates: {
      significant: 38.2,
      mild: 24.5,
      none: 15.3,
      insufficient: 22.0
    },
    commonNutraceuticals: [
      { name: 'Glucosamina + Condroitina', usage: 67 },
      { name: 'Curcumina', usage: 52 },
      { name: 'Ômega-3', usage: 45 },
      { name: 'MSM', usage: 38 }
    ],
    averageTimeToImprovement: 6.8,
    ageDistribution: [
      { range: '7-9 anos', count: 1254 },
      { range: '10-12 anos', count: 987 },
      { range: '13+ anos', count: 606 }
    ]
  },
  {
    id: 'cardiac',
    name: 'Doença Cardíaca',
    name_en: 'Heart Disease',
    totalCases: 1523,
    breedDistribution: [
      { breed: 'Cavalier King Charles', percentage: 42, count: 640 },
      { breed: 'Boxer', percentage: 25, count: 381 },
      { breed: 'Doberman', percentage: 18, count: 274 },
      { breed: 'Cocker Spaniel', percentage: 10, count: 152 },
      { breed: 'Outros', percentage: 5, count: 76 }
    ],
    responseRates: {
      significant: 28.4,
      mild: 31.2,
      none: 18.7,
      insufficient: 21.7
    },
    commonNutraceuticals: [
      { name: 'Coenzima Q10', usage: 78 },
      { name: 'Taurina', usage: 65 },
      { name: 'L-Carnitina', usage: 54 },
      { name: 'Ômega-3', usage: 48 }
    ],
    averageTimeToImprovement: 10.2,
    ageDistribution: [
      { range: '8-10 anos', count: 685 },
      { range: '11-13 anos', count: 534 },
      { range: '14+ anos', count: 304 }
    ]
  },
  {
    id: 'renal',
    name: 'Doença Renal Crônica',
    name_en: 'Chronic Kidney Disease',
    totalCases: 1201,
    breedDistribution: [
      { breed: 'Cocker Spaniel', percentage: 32, count: 384 },
      { breed: 'Bull Terrier', percentage: 28, count: 336 },
      { breed: 'Pastor Alemão', percentage: 22, count: 264 },
      { breed: 'Beagle', percentage: 12, count: 144 },
      { breed: 'Outros', percentage: 6, count: 73 }
    ],
    responseRates: {
      significant: 24.8,
      mild: 28.3,
      none: 22.1,
      insufficient: 24.8
    },
    commonNutraceuticals: [
      { name: 'Ômega-3', usage: 71 },
      { name: 'Probióticos', usage: 58 },
      { name: 'Antioxidantes', usage: 45 },
      { name: 'Fosfato Reduzido', usage: 39 }
    ],
    averageTimeToImprovement: 12.5,
    ageDistribution: [
      { range: '9-11 anos', count: 540 },
      { range: '12-14 anos', count: 445 },
      { range: '15+ anos', count: 216 }
    ]
  },
  {
    id: 'hepatic',
    name: 'Problemas Hepáticos',
    name_en: 'Liver Problems',
    totalCases: 987,
    breedDistribution: [
      { breed: 'Yorkshire Terrier', percentage: 35, count: 345 },
      { breed: 'Maltês', percentage: 28, count: 276 },
      { breed: 'Doberman', percentage: 20, count: 197 },
      { breed: 'Bedlington Terrier', percentage: 12, count: 118 },
      { breed: 'Outros', percentage: 5, count: 51 }
    ],
    responseRates: {
      significant: 31.5,
      mild: 26.7,
      none: 19.2,
      insufficient: 22.6
    },
    commonNutraceuticals: [
      { name: 'SAMe', usage: 73 },
      { name: 'Cardo Mariano', usage: 69 },
      { name: 'Vitamina E', usage: 52 },
      { name: 'Zinc', usage: 41 }
    ],
    averageTimeToImprovement: 8.4,
    ageDistribution: [
      { range: '6-8 anos', count: 394 },
      { range: '9-11 anos', count: 395 },
      { range: '12+ anos', count: 198 }
    ]
  },
  {
    id: 'allergies',
    name: 'Alergias/Dermatites',
    name_en: 'Allergies/Dermatitis',
    totalCases: 1834,
    breedDistribution: [
      { breed: 'Bulldog', percentage: 28, count: 513 },
      { breed: 'Shih Tzu', percentage: 24, count: 440 },
      { breed: 'Golden Retriever', percentage: 18, count: 330 },
      { breed: 'Pug', percentage: 16, count: 293 },
      { breed: 'Outros', percentage: 14, count: 258 }
    ],
    responseRates: {
      significant: 45.2,
      mild: 28.4,
      none: 12.1,
      insufficient: 14.3
    },
    commonNutraceuticals: [
      { name: 'Ômega-3', usage: 82 },
      { name: 'Probióticos', usage: 68 },
      { name: 'Quercetina', usage: 54 },
      { name: 'Spirulina', usage: 43 }
    ],
    averageTimeToImprovement: 4.2,
    ageDistribution: [
      { range: '2-4 anos', count: 642 },
      { range: '5-7 anos', count: 733 },
      { range: '8+ anos', count: 459 }
    ]
  },
  {
    id: 'anxiety',
    name: 'Ansiedade/Comportamental',
    name_en: 'Anxiety/Behavioral',
    totalCases: 1456,
    breedDistribution: [
      { breed: 'Border Collie', percentage: 32, count: 466 },
      { breed: 'Pastor Alemão', percentage: 26, count: 379 },
      { breed: 'Labrador Retriever', percentage: 18, count: 262 },
      { breed: 'Chihuahua', percentage: 14, count: 204 },
      { breed: 'Outros', percentage: 10, count: 145 }
    ],
    responseRates: {
      significant: 42.8,
      mild: 31.5,
      none: 10.2,
      insufficient: 15.5
    },
    commonNutraceuticals: [
      { name: 'L-Teanina', usage: 76 },
      { name: 'Triptofano', usage: 64 },
      { name: 'Ashwagandha', usage: 48 },
      { name: 'Magnésio', usage: 41 }
    ],
    averageTimeToImprovement: 5.6,
    ageDistribution: [
      { range: '1-3 anos', count: 524 },
      { range: '4-6 anos', count: 583 },
      { range: '7+ anos', count: 349 }
    ]
  },
  {
    id: 'obesity',
    name: 'Obesidade',
    name_en: 'Obesity',
    totalCases: 2134,
    breedDistribution: [
      { breed: 'Labrador Retriever', percentage: 29, count: 619 },
      { breed: 'Beagle', percentage: 24, count: 512 },
      { breed: 'Bulldog', percentage: 19, count: 405 },
      { breed: 'Pug', percentage: 15, count: 320 },
      { breed: 'Outros', percentage: 13, count: 278 }
    ],
    responseRates: {
      significant: 36.7,
      mild: 29.8,
      none: 16.4,
      insufficient: 17.1
    },
    commonNutraceuticals: [
      { name: 'L-Carnitina', usage: 79 },
      { name: 'Garcinia Cambogia', usage: 62 },
      { name: 'Cromo', usage: 54 },
      { name: 'Fibras (Psyllium)', usage: 48 }
    ],
    averageTimeToImprovement: 11.3,
    ageDistribution: [
      { range: '3-5 anos', count: 747 },
      { range: '6-8 anos', count: 896 },
      { range: '9+ anos', count: 491 }
    ]
  },
  {
    id: 'diabetes',
    name: 'Diabetes Mellitus',
    name_en: 'Diabetes Mellitus',
    totalCases: 876,
    breedDistribution: [
      { breed: 'Schnauzer', percentage: 34, count: 298 },
      { breed: 'Poodle', percentage: 27, count: 237 },
      { breed: 'Beagle', percentage: 18, count: 158 },
      { breed: 'Dachshund', percentage: 13, count: 114 },
      { breed: 'Outros', percentage: 8, count: 69 }
    ],
    responseRates: {
      significant: 27.3,
      mild: 32.8,
      none: 19.5,
      insufficient: 20.4
    },
    commonNutraceuticals: [
      { name: 'Cromo', usage: 81 },
      { name: 'Ácido Alfa-Lipóico', usage: 68 },
      { name: 'Canela', usage: 57 },
      { name: 'Gymnema Sylvestre', usage: 44 }
    ],
    averageTimeToImprovement: 14.7,
    ageDistribution: [
      { range: '7-9 anos', count: 368 },
      { range: '10-12 anos', count: 350 },
      { range: '13+ anos', count: 158 }
    ]
  },
  {
    id: 'cancer',
    name: 'Suporte Oncológico',
    name_en: 'Cancer Support',
    totalCases: 989,
    breedDistribution: [
      { breed: 'Golden Retriever', percentage: 31, count: 306 },
      { breed: 'Boxer', percentage: 26, count: 257 },
      { breed: 'Rottweiler', percentage: 21, count: 208 },
      { breed: 'Bernese Mountain Dog', percentage: 14, count: 138 },
      { breed: 'Outros', percentage: 8, count: 80 }
    ],
    responseRates: {
      significant: 22.1,
      mild: 29.4,
      none: 24.3,
      insufficient: 24.2
    },
    commonNutraceuticals: [
      { name: 'Curcumina', usage: 84 },
      { name: 'Resveratrol', usage: 71 },
      { name: 'Ômega-3 (EPA/DHA)', usage: 69 },
      { name: 'Cogumelos Medicinais', usage: 56 }
    ],
    averageTimeToImprovement: 16.8,
    ageDistribution: [
      { range: '8-10 anos', count: 395 },
      { range: '11-13 anos', count: 415 },
      { range: '14+ anos', count: 179 }
    ]
  }
];

// Calculate total pets from all conditions
const TOTAL_PETS = HEALTH_CONDITIONS.reduce((sum, condition) => sum + condition.totalCases, 0);

export const generateMockPets = (count: number = TOTAL_PETS): Pet[] => {
  const pets: Pet[] = [];
  const regions = ['Sul', 'Sudeste', 'Centro-Oeste', 'Nordeste', 'Norte'];
  
  // Distribute pets across conditions
  HEALTH_CONDITIONS.forEach((condition) => {
    const conditionPets = Math.round((condition.totalCases / TOTAL_PETS) * count);
    
    for (let i = 0; i < conditionPets; i++) {
      const breed = selectBreedByDistribution(condition.breedDistribution);
      const responseStatus = selectResponseStatus(condition.responseRates);
      const followUpMonths = Math.floor(Math.random() * 24) + 1; // 1-24 months
      
      pets.push({
        id: `pet-${pets.length + 1}`,
        name: `Pet ${pets.length + 1}`,
        breed,
        age: Math.floor(Math.random() * 12) + 2, // 2-14 years
        conditions: [condition.id],
        treatmentStartDate: new Date(Date.now() - followUpMonths * 30 * 24 * 60 * 60 * 1000),
        followUpMonths,
        responseStatus,
        adherenceRate: Math.random() * 40 + 60, // 60-100%
        nutraceuticals: selectNutraceuticals(condition.commonNutraceuticals),
        region: regions[Math.floor(Math.random() * regions.length)]
      });
    }
  });
  
  return pets;
};

function selectBreedByDistribution(distribution: { breed: string; percentage: number }[]): string {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const item of distribution) {
    cumulative += item.percentage;
    if (rand <= cumulative) return item.breed;
  }
  
  return distribution[distribution.length - 1].breed;
}

function selectResponseStatus(rates: ConditionData['responseRates']): Pet['responseStatus'] {
  const rand = Math.random() * 100;
  
  if (rand < rates.significant) return 'significant';
  if (rand < rates.significant + rates.mild) return 'mild';
  if (rand < rates.significant + rates.mild + rates.none) return 'none';
  return 'insufficient';
}

function selectNutraceuticals(common: { name: string; usage: number }[]): string[] {
  const selected: string[] = [];
  common.forEach((nut) => {
    if (Math.random() * 100 < nut.usage) {
      selected.push(nut.name);
    }
  });
  return selected.length > 0 ? selected : [common[0].name];
}

export const generateTimelineData = (pets: Pet[]): TimelinePoint[] => {
  const timeline: TimelinePoint[] = [];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Realistic S-curve pattern: growth → acceleration → plateau
  // Simulates cumulative response rate over 12 months of treatment
  const baseSignificant = [45, 68, 92, 118, 142, 165, 185, 198, 205, 210, 207, 203];
  const baseMild = [58, 72, 88, 105, 118, 128, 133, 136, 138, 132, 128, 125];
  const baseNone = [38, 48, 58, 72, 85, 95, 102, 106, 108, 107, 105, 103];
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - i);
    const monthIndex = monthDate.getMonth();
    
    // Add realistic variability (±5%)
    const variance = () => 1 + (Math.random() - 0.5) * 0.1;
    
    timeline.push({
      month: months[monthIndex],
      newPets: 75 + Math.floor(Math.random() * 30), // 75-105 new pets/month
      significantResponse: Math.floor(baseSignificant[monthIndex] * variance()),
      mildResponse: Math.floor(baseMild[monthIndex] * variance()),
      noResponse: Math.floor(baseNone[monthIndex] * variance()),
      dropouts: Math.floor(15 + (11 - i) * 1.2) // Dropout grows slowly
    });
  }
  
  return timeline;
};

export const getClinicalStats = (pets: Pet[]) => {
  const total = pets.length;
  const significant = pets.filter(p => p.responseStatus === 'significant').length;
  const mild = pets.filter(p => p.responseStatus === 'mild').length;
  const none = pets.filter(p => p.responseStatus === 'none').length;
  const insufficient = pets.filter(p => p.responseStatus === 'insufficient').length;
  
  const avgFollowup = pets.reduce((sum, p) => sum + p.followUpMonths, 0) / total;
  const avgAdherence = pets.reduce((sum, p) => sum + p.adherenceRate, 0) / total;
  
  return {
    total,
    significant: { count: significant, percentage: (significant / total * 100).toFixed(1) },
    mild: { count: mild, percentage: (mild / total * 100).toFixed(1) },
    none: { count: none, percentage: (none / total * 100).toFixed(1) },
    insufficient: { count: insufficient, percentage: (insufficient / total * 100).toFixed(1) },
    avgFollowup: avgFollowup.toFixed(1),
    avgAdherence: avgAdherence.toFixed(1)
  };
};
