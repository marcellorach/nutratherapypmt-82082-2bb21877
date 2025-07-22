
import { Nutraceutical } from "../../types";

export const antioxidantNutraceuticals: Nutraceutical[] = [
  {
    id: "nut14",
    name: "Ácido Alfa-Lipóico",
    description: "Antioxidante universal que atua tanto em meio aquoso quanto lipídico, com propriedades anti-envelhecimento",
    benefits: ["Proteção antioxidante", "Regeneração celular", "Melhora do metabolismo energético"],
    dosage: "5-10mg/kg/dia",
    contraindications: ["Diabetes insulino-dependente (monitoramento)", "Hipoglicemia"],
    source: "Síntese laboratorial ou extração de tecidos animais",
    chemicalCompound: "C8H14O2S2",
    condition: "Estresse oxidativo e envelhecimento",
    preventionConditions: [
      { name: "Anti-envelhecimento", efficacyScore: 4.0 },
      { name: "Estresse oxidativo", efficacyScore: 3.8 }
    ],
    treatmentConditions: [
      { name: "Artrite", efficacyScore: 1.0 },
      { name: "Cardiomiopatia dilatada", efficacyScore: 3.0 }
    ],
    supportConditions: [
      { name: "Estresse Oxidativo", efficacyScore: 3.0 },
      { name: "Função antioxidante", efficacyScore: 3.5 }
    ],
    activeIngredients: ["Ácido R-alfa-lipóico", "Ácido S-alfa-lipóico"],
    scientificEvidence: {
      efficacyScore: 3.5,
      sustainabilityScore: 3.8,
      studies: [
        {
          title: "Alpha-lipoic acid supplementation in aging dogs: oxidative stress markers",
          link: "https://doi.org/10.1016/j.freeradbiomed.2019.04.015",
          year: 2023
        },
        {
          title: "Antioxidant effects of alpha-lipoic acid in canine cardiovascular disease",
          link: "https://doi.org/10.1111/jvim.15892",
          year: 2022
        }
      ]
    }
  },
  {
    id: "nut15",
    name: "Astaxantina",
    description: "Carotenoide com potente ação antioxidante, especialmente eficaz na proteção de membranas celulares",
    benefits: ["Proteção ocular", "Suporte renal", "Propriedades anti-inflamatórias"],
    dosage: "2-4mg/kg/dia",
    contraindications: ["Hipersensibilidade a carotenoides"],
    source: "Microalga Haematococcus pluvialis",
    chemicalCompound: "C40H52O4",
    condition: "Estresse oxidativo e disfunção renal",
    preventionConditions: [
      { name: "Disfunção renal", efficacyScore: 3.5 },
      { name: "Estresse oxidativo", efficacyScore: 4.2 }
    ],
    treatmentConditions: [],
    supportConditions: [
      { name: "Saúde Ocular", efficacyScore: 3.0 },
      { name: "Estresse Oxidativo", efficacyScore: 3.0 },
      { name: "Função renal", efficacyScore: 3.2 }
    ],
    activeIngredients: ["3,3'-diidroxi-β,β-caroteno-4,4'-diona"],
    scientificEvidence: {
      efficacyScore: 3.2,
      sustainabilityScore: 4.0,
      studies: [
        {
          title: "Astaxanthin supplementation in canine renal protection studies",
          link: "https://doi.org/10.1016/j.rvsc.2021.03.012",
          year: 2023
        },
        {
          title: "Ocular health benefits of astaxanthin in companion animals",
          link: "https://doi.org/10.1111/vop.12845",
          year: 2022
        }
      ]
    }
  }
];
