
import { Nutraceutical } from "../../types";

export const experimentalNutraceuticals: Nutraceutical[] = [
  {
    id: "nut8",
    name: "Própolis Verde",
    description: "Substância resinosa coletada por abelhas, com potenciais propriedades antimicrobianas",
    benefits: ["Ação antimicrobiana", "Propriedades anti-inflamatórias", "Suporte imunológico"],
    dosage: "0.5-1.0ml/kg/dia de extrato",
    contraindications: ["Alergia a produtos apícolas"],
    source: "Resina coletada por abelhas de árvores específicas",
    chemicalCompound: "Compostos fenólicos, flavonoides e ácidos orgânicos",
    condition: "Infecções respiratórias",
    preventionConditions: [
      { name: "Infecções respiratórias", efficacyScore: 2.5 },
      { name: "Alergias sazonais", efficacyScore: 2.2 }
    ],
    treatmentConditions: [
      { name: "Infecções bacterianas leves", efficacyScore: 2.5 }
    ],
    supportConditions: [
      { name: "Sistema imune", efficacyScore: 3.0 }
    ],
    activeIngredients: ["Artepillin C", "Ácido cafeico", "Quercetina"],
    scientificEvidence: {
      efficacyScore: 2.5,
      sustainabilityScore: 3.0,
      studies: [
        {
          title: "Efeitos da própolis verde em cães com infecções respiratórias",
          link: "https://doi.org/10.xxxx/yyyy",
          year: 2023
        }
      ]
    }
  },
  {
    id: "nut9",
    name: "Pólen de Abelha",
    description: "Suplemento natural rico em proteínas e antioxidantes",
    benefits: ["Suporte nutricional", "Energia", "Antioxidantes naturais"],
    dosage: "50-100mg/kg/dia",
    contraindications: ["Alergia a produtos apícolas", "Histórico de anafilaxia"],
    source: "Pólen coletado por abelhas de diversas flores",
    chemicalCompound: "Proteínas, carboidratos, lipídios, vitaminas e minerais",
    condition: "Fadiga crônica",
    preventionConditions: [
      { name: "Deficiência nutricional", efficacyScore: 1.8 }
    ],
    treatmentConditions: [
      { name: "Fadiga", efficacyScore: 2.0 }
    ],
    supportConditions: [
      { name: "Metabolismo", efficacyScore: 2.2 },
      { name: "Energia", efficacyScore: 2.5 }
    ],
    activeIngredients: ["Proteínas", "Flavonoides", "Carotenoides"],
    scientificEvidence: {
      efficacyScore: 1.8,
      sustainabilityScore: 4.0,
      studies: [
        {
          title: "Avaliação preliminar do uso de pólen de abelha em pets",
          link: "https://doi.org/10.xxxx/zzzz",
          year: 2024
        }
      ]
    }
  }
];
