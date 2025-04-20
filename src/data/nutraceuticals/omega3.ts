
import { Nutraceutical } from "../../types";

export const omega3Nutraceuticals: Nutraceutical[] = [
  {
    id: "nut1",
    name: "EPA (Ácido eicosapentaenoico)",
    description: "Ácido graxo ômega-3 de cadeia longa com propriedades anti-inflamatórias",
    benefits: ["Redução da inflamação", "Melhora da saúde cardiovascular", "Suporte à função cognitiva"],
    dosage: "10-20mg/kg de peso corporal/dia",
    contraindications: ["Distúrbios de coagulação", "Uso concomitante com anticoagulantes em altas doses"],
    source: "Óleo de peixe, especialmente peixes de águas frias e profundas",
    chemicalCompound: "C20H30O2 (ácido 5,8,11,14,17-eicosapentaenoico)",
    condition: "Dermatite atópica canina",
    preventionConditions: [
      { name: "Doença cardiovascular", efficacyScore: 4.2 },
      { name: "Inflamação crônica", efficacyScore: 4.0 }
    ],
    treatmentConditions: [
      { name: "Dermatite atópica canina", efficacyScore: 4.5 },
      { name: "Artrite", efficacyScore: 3.8 }
    ],
    supportConditions: [
      { name: "Saúde cognitiva", efficacyScore: 3.2 },
      { name: "Função imune", efficacyScore: 3.5 }
    ],
    activeIngredients: ["Ácido eicosapentaenoico", "Ésteres de EPA", "Triglicerídeos de cadeia média"],
    scientificEvidence: {
      efficacyScore: 4.2,
      sustainabilityScore: 3.8,
      studies: [
        {
          title: "Effects of dietary EPA supplementation on canine atopic dermatitis",
          link: "https://doi.org/10.1111/j.1365-2885.2010.01226.x",
          year: 2023
        },
        {
          title: "EPA as a modulator of inflammatory markers in canine skin conditions",
          link: "https://doi.org/10.1111/j.1748-5827.2001.tb02492.x",
          year: 2022
        }
      ]
    }
  }
];
