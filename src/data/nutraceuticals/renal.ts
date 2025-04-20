
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
    preventionConditions: ["Lesão renal"],
    treatmentConditions: ["Nefropatia"],
    supportConditions: ["Função renal"],
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
    description: "Erva tradicional com propriedades nefroprotetoras",
    benefits: ["Suporte à função renal", "Modulação imunológica", "Proteção celular"],
    dosage: "2-4mg/kg/dia do extrato padronizado",
    contraindications: ["Doenças autoimunes", "Uso de imunossupressores"],
    source: "Raiz de Astragalus membranaceus",
    chemicalCompound: "Complexo de saponinas e flavonoides",
    condition: "Insuficiência renal",
    preventionConditions: ["Disfunção renal"],
    treatmentConditions: ["Proteínuria"],
    supportConditions: ["Sistema imunológico renal"],
    activeIngredients: ["Astragalosídeos", "Isoflavonas"],
    scientificEvidence: {
      efficacyScore: 2.8,
      sustainabilityScore: 3.0,
      studies: [
        {
          title: "Astragalus effects on canine kidney function",
          link: "https://doi.org/10.xxxx/bbbb",
          year: 2023
        }
      ]
    }
  }
];
