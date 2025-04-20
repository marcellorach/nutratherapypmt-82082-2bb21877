
import { Nutraceutical } from "../../types";

export const immuneSupportNutraceuticals: Nutraceutical[] = [
  {
    id: "nut5",
    name: "Equinácea",
    description: "Fitoquímico com propriedades imunoestimulantes e antimicrobianas",
    benefits: ["Estimulação do sistema imunológico", "Propriedades antimicrobianas", "Redução da duração de infecções"],
    dosage: "1-2mg/kg de extrato padronizado/dia em ciclos de 3 semanas",
    contraindications: ["Doenças autoimunes", "Imunossupressão medicamentosa"],
    source: "Echinacea purpurea (planta)",
    chemicalCompound: "Alquilamidas, glicoproteínas, polissacarídeos e derivados do ácido cafeico",
    condition: "Imunodeficiência",
    preventionConditions: [
      { name: "Infecções recorrentes", efficacyScore: 3.4 }
    ],
    treatmentConditions: [
      { name: "Imunodeficiência", efficacyScore: 3.6 }
    ],
    supportConditions: [
      { name: "Sistema imunológico", efficacyScore: 4.2 }
    ],
    activeIngredients: ["Alquilamidas", "Glicoproteínas", "Polissacarídeos", "Derivados do ácido cafeico"],
    scientificEvidence: {
      efficacyScore: 3.4,
      sustainabilityScore: 4.2,
      studies: [
        {
          title: "Immunomodulatory effects of Echinacea in canine lymphocytes",
          link: "https://doi.org/10.5326/JAAHA-MS-6942",
          year: 2021
        },
        {
          title: "Clinical applications of Echinacea in veterinary medicine",
          link: "https://doi.org/10.1016/j.vetimm.2018.05.002",
          year: 2023
        }
      ]
    }
  }
];
