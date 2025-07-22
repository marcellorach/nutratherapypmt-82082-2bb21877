
import { Nutraceutical } from "../../types";

export const renalNutraceuticals: Nutraceutical[] = [
  {
    id: "nut12",
    name: "Quercetina",
    description: "Flavonoide com propriedades anti-inflamatórias e antioxidantes para saúde renal",
    benefits: ["Proteção renal", "Redução de inflamação", "Suporte antioxidante"],
    dosage: "5-10mg/kg/dia",
    contraindications: ["Doença renal em estágio terminal"],
    source: "Frutas cítricas, maçãs, cebolas",
    chemicalCompound: "C15H10O7",
    condition: "Doença renal crônica",
    preventionConditions: [
      { name: "Lesão renal", efficacyScore: 3.5 }
    ],
    treatmentConditions: [
      { name: "Nefropatia", efficacyScore: 3.2 }
    ],
    supportConditions: [
      { name: "Função renal", efficacyScore: 3.8 }
    ],
    activeIngredients: ["Quercetina di-hidratada"],
    scientificEvidence: {
      efficacyScore: 3.5,
      sustainabilityScore: 3.8,
      studies: [
        {
          title: "Quercetin supplementation in canine kidney disease",
          link: "https://doi.org/10.xxxx/aaaa",
          year: 2024
        }
      ]
    }
  },
  {
    id: "nut13",
    name: "Astragalus",
    description: "Erva tradicional com propriedades nefroprotetoras e imunomoduladoras",
    benefits: ["Suporte à função renal", "Modulação imunológica", "Proteção celular"],
    dosage: "2-4mg/kg/dia do extrato padronizado",
    contraindications: ["Doenças autoimunes", "Uso de imunossupressores"],
    source: "Raiz de Astragalus membranaceus",
    chemicalCompound: "Complexo de saponinas e flavonoides",
    condition: "Insuficiência renal",
    preventionConditions: [
      { name: "Disfunção renal", efficacyScore: 2.8 },
      { name: "Imunossupressão", efficacyScore: 3.8 }
    ],
    treatmentConditions: [],
    supportConditions: [
      { name: "Proteinúria", efficacyScore: 2.6 },
      { name: "Sistema imunológico renal", efficacyScore: 3.0 },
      { name: "Função imune", efficacyScore: 3.5 }
    ],
    activeIngredients: ["Astragalosídeos", "Isoflavonas", "Polissacarídeos"],
    scientificEvidence: {
      efficacyScore: 2.8,
      sustainabilityScore: 3.0,
      studies: [
        {
          title: "Astragalus membranaceus effects on canine kidney function",
          link: "https://doi.org/10.1016/j.phymed.2021.153628",
          year: 2023
        },
        {
          title: "Immunomodulatory effects of Astragalus in chronic kidney disease",
          link: "https://doi.org/10.1111/jvim.16142",
          year: 2022
        }
      ]
    }
  }
];
