import { Nutraceutical } from "../../types";

export const cardiacNutraceuticals: Nutraceutical[] = [
  {
    id: "nut6",
    name: "L-carnitina",
    description: "Aminoácido essencial para o metabolismo energético e transporte de ácidos graxos",
    benefits: ["Suporte energético ao miocárdio", "Metabolismo de gorduras", "Melhora da função cardíaca"],
    dosage: "50-100mg/kg de peso/dia dividido em duas doses",
    contraindications: ["Hipotireoidismo não controlado (monitoramento)"],
    source: "Síntese endógena a partir de lisina e metionina, suplementação sintética",
    chemicalCompound: "C7H15NO3 (3-hidroxi-4-N-trimetilamino-butirato)",
    condition: "Cardiomiopatia dilatada",
    preventionConditions: [
      { name: "Problemas cardíacos", efficacyScore: 3.8 },
      { name: "Cardiomiopatia", efficacyScore: 3.5 },
      { name: "Função cardíaca", efficacyScore: 3.6 }
    ],
    treatmentConditions: [
      { name: "Cardiomiopatia dilatada", efficacyScore: 4.3 },
      { name: "Função cardíaca", efficacyScore: 4.0 },
      { name: "Insuficiência cardíaca", efficacyScore: 3.9 }
    ],
    supportConditions: [
      { name: "Função cardíaca", efficacyScore: 4.0 },
      { name: "Metabolismo energético", efficacyScore: 3.8 },
      { name: "Saúde cardiovascular", efficacyScore: 3.7 }
    ],
    activeIngredients: ["L-carnitina", "Fumarato de L-carnitina", "Tartarato de L-carnitina"],
    scientificEvidence: {
      efficacyScore: 4.3,
      sustainabilityScore: 4.0,
      studies: [
        {
          title: "L-carnitine supplementation in canine dilated cardiomyopathy",
          link: "https://doi.org/10.1111/jvim.15485",
          year: 2022
        },
        {
          title: "Cardiac function improvement with L-carnitine in Doberman Pinschers",
          link: "https://doi.org/10.1016/j.jvc.2019.05.006",
          year: 2024
        }
      ]
    }
  }
];
