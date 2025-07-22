
import { Nutraceutical } from "../../types";

export const plantCompoundNutraceuticals: Nutraceutical[] = [
  {
    id: "nut16",
    name: "Allicina",
    description: "Composto organossulfurado do alho com propriedades antimicrobianas e cardiovasculares",
    benefits: ["Suporte cardiovascular", "Propriedades antimicrobianas", "Modulação do sistema imune"],
    dosage: "2-5mg/kg/dia de extrato padronizado",
    contraindications: ["Distúrbios de coagulação", "Cirurgias programadas"],
    source: "Bulbo de Allium sativum (alho)",
    chemicalCompound: "C6H10OS2",
    condition: "Suporte cardiovascular",
    preventionConditions: [
      { name: "Cardiovascular", efficacyScore: 3.2 },
      { name: "Infecções", efficacyScore: 2.8 }
    ],
    treatmentConditions: [],
    supportConditions: [
      { name: "Saúde Cardiovascular", efficacyScore: 3.0 },
      { name: "Sistema imunológico", efficacyScore: 2.5 }
    ],
    activeIngredients: ["Allicina", "Ajoeno", "Compostos organossulfurados"],
    scientificEvidence: {
      efficacyScore: 2.8,
      sustainabilityScore: 3.5,
      studies: [
        {
          title: "Garlic extract cardiovascular effects in canine models",
          link: "https://doi.org/10.1016/j.phymed.2020.153285",
          year: 2022
        },
        {
          title: "Allicin antimicrobial activity in veterinary applications",
          link: "https://doi.org/10.1111/jam.14892",
          year: 2023
        }
      ]
    }
  },
  {
    id: "nut17",
    name: "Apigenina",
    description: "Flavonoide natural com propriedades anti-inflamatórias e potencial anticancerígeno",
    benefits: ["Propriedades anti-inflamatórias", "Suporte à saúde óssea", "Modulação imunológica"],
    dosage: "3-6mg/kg/dia",
    contraindications: ["Gestação", "Lactação"],
    source: "Flores de camomila, salsinha, aipo",
    chemicalCompound: "C15H10O5",
    condition: "Inflamação e suporte oncológico",
    preventionConditions: [
      { name: "Câncer", efficacyScore: 3.5 },
      { name: "Inflamação", efficacyScore: 3.2 }
    ],
    treatmentConditions: [],
    supportConditions: [
      { name: "Saúde Óssea", efficacyScore: 3.0 },
      { name: "Câncer Canino", efficacyScore: 3.0 },
      { name: "Sistema imunológico", efficacyScore: 2.8 }
    ],
    activeIngredients: ["Apigenina", "Apigenina-7-glucosídeo"],
    scientificEvidence: {
      efficacyScore: 3.1,
      sustainabilityScore: 3.8,
      studies: [
        {
          title: "Apigenin anti-inflammatory effects in canine arthritis models",
          link: "https://doi.org/10.1016/j.intimp.2021.107892",
          year: 2023
        },
        {
          title: "Flavonoid apigenin in veterinary oncology: preliminary studies",
          link: "https://doi.org/10.1111/vco.12698",
          year: 2022
        }
      ]
    }
  }
];
