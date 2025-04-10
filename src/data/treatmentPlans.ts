
import { TreatmentPlan } from "../types";

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
        reason: "Dermatite atópica recorrente com ressecamento da pelagem",
        dosage: "30mg/kg/dia (dividido em duas administrações)",
        duration: "3 meses",
        startDate: "2025-04-15",
        priority: 1
      },
      {
        id: "rec2",
        petId: "pet1",
        nutraceuticalId: "nut3",
        reason: "Fortalecimento do sistema imunológico após infecção recente",
        dosage: "300mg/kg/dia do complexo imunomodulador",
        duration: "2 meses",
        startDate: "2025-04-15",
        priority: 2
      },
      {
        id: "rec10",
        petId: "pet1",
        nutraceuticalId: "nut6",
        reason: "Suporte hepático após tratamento medicamentoso prolongado",
        dosage: "18mg/kg/dia de silimarina, dividido em duas doses",
        duration: "45 dias",
        startDate: "2025-04-20",
        priority: 3
      }
    ],
    notes: "Reavaliar após 1 mês para ajustes na dosagem se necessário. Monitorar enzimas hepáticas antes e após tratamento com silimarina."
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
        dosage: "20mg/kg/dia de sulfato de condroitina e 15mg/kg/dia de glucosamina",
        duration: "Contínuo",
        startDate: "2025-04-10",
        priority: 1
      }
    ],
    notes: "Monitorar mobilidade e disposição do animal. Considerar adição de ácidos graxos essenciais em 3 meses."
  },
  {
    id: "pln3",
    petId: "pet4",
    veterinarianId: "vet1",
    createdAt: "2025-03-20",
    recommendations: [
      {
        id: "rec4",
        petId: "pet4",
        nutraceuticalId: "nut1",
        reason: "Melhoria da pelagem e prevenção de alergias sazonais",
        dosage: "25mg/kg/dia de ácidos graxos essenciais",
        duration: "6 meses",
        startDate: "2025-03-22",
        priority: 2
      }
    ],
    notes: "Atentar para possíveis reações alérgicas nos primeiros dias. Avaliar qualidade da pelagem após 2 meses."
  },
  {
    id: "pln4",
    petId: "pet6",
    veterinarianId: "vet1",
    createdAt: "2025-03-30",
    recommendations: [
      {
        id: "rec5",
        petId: "pet6",
        nutraceuticalId: "nut4",
        reason: "Prevenção de problemas cardíacos comuns em Beagles",
        dosage: "40mg/kg/dia de L-carnitina e 1.5mg/kg/dia de coenzima Q10",
        duration: "Contínuo",
        startDate: "2025-04-01",
        priority: 1
      },
      {
        id: "rec9",
        petId: "pet6",
        nutraceuticalId: "nut7",
        reason: "Suporte cognitivo para envelhecimento saudável",
        dosage: "30mg/kg/dia do complexo neuroprotetor",
        duration: "Contínuo",
        startDate: "2025-04-02",
        priority: 2
      }
    ],
    notes: "Verificar frequência cardíaca mensalmente. Avaliar responsividade e cognição a cada 3 meses."
  },
  {
    id: "pln5",
    petId: "pet7",
    veterinarianId: "vet1",
    createdAt: "2025-03-12",
    recommendations: [
      {
        id: "rec6",
        petId: "pet7",
        nutraceuticalId: "nut5",
        reason: "Prevenção de tártaro e problemas periodontais",
        dosage: "Solução 0.12% aplicada diariamente nas gengivas",
        duration: "Contínuo",
        startDate: "2025-03-15",
        priority: 3
      }
    ],
    notes: "Avaliar condições bucais após 60 dias de uso. Recomendar limpeza profissional se necessário."
  },
  {
    id: "pln6",
    petId: "pet8",
    veterinarianId: "vet1",
    createdAt: "2025-04-03",
    recommendations: [
      {
        id: "rec7",
        petId: "pet8",
        nutraceuticalId: "nut2",
        reason: "Prevenção de problemas articulares devido ao peso",
        dosage: "25mg/kg/dia de sulfato de condroitina e 20mg/kg/dia de glucosamina",
        duration: "Contínuo",
        startDate: "2025-04-05",
        priority: 1
      }
    ],
    notes: "Associar a recomendação com orientações de dieta e exercícios. Monitorar peso mensalmente."
  },
  {
    id: "pln7",
    petId: "pet10",
    veterinarianId: "vet1",
    createdAt: "2025-04-10",
    recommendations: [
      {
        id: "rec8",
        petId: "pet10",
        nutraceuticalId: "nut3",
        reason: "Fortalecimento imunológico preventivo",
        dosage: "350mg/kg/dia de complexo imunomodulador",
        duration: "3 meses",
        startDate: "2025-04-12",
        priority: 2
      }
    ],
    notes: "Monitorar energia e disposição durante o tratamento. Realizar hemograma completo após 3 meses."
  }
];
