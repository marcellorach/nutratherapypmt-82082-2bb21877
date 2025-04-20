import { Nutraceutical } from "../../types";

export const jointHealthNutraceuticals: Nutraceutical[] = [
  {
    id: "nut3",
    name: "Glucosamina",
    description: "Aminomonossacarídeo precursor na síntese de glicosaminoglicanos nas articulações",
    benefits: ["Suporte à cartilagem", "Redução da inflamação articular", "Melhora da mobilidade"],
    dosage: "15-20mg/kg de peso/dia",
    contraindications: ["Diabetes (monitoramento da glicemia)", "Insuficiência renal"],
    source: "Exoesqueleto de crustáceos, produção sintética",
    chemicalCompound: "C6H13NO5 (2-amino-2-desoxi-D-glucose)",
    condition: "Osteoartrite canina",
    preventionConditions: [
      { name: "Osteoartrite canina", efficacyScore: 3.2 },
      { name: "Problemas articulares", efficacyScore: 3.8 },
      { name: "Degeneração cartilaginosa", efficacyScore: 3.5 }
    ],
    treatmentConditions: [
      { name: "Osteoartrite canina", efficacyScore: 4.2 },
      { name: "Problemas articulares", efficacyScore: 4.0 },
      { name: "Dor articular", efficacyScore: 3.9 }
    ],
    supportConditions: [
      { name: "Osteoartrite canina", efficacyScore: 3.7 },
      { name: "Mobilidade articular", efficacyScore: 4.0 },
      { name: "Saúde das cartilagens", efficacyScore: 3.8 }
    ],
    activeIngredients: ["2-amino-2-desoxi-D-glucose", "Sulfato de glucosamina", "Cloridrato de glucosamina"],
    scientificEvidence: {
      efficacyScore: 3.8,
      sustainabilityScore: 4.0,
      studies: [
        {
          title: "Long-term effects of glucosamine on canine osteoarthritis",
          link: "https://doi.org/10.2460/javma.2007.230.514",
          year: 2024
        },
        {
          title: "Glucosamine bioavailability in canine joint health",
          link: "https://doi.org/10.1111/j.1532-950X.1992.tb00086.x",
          year: 2022
        }
      ]
    }
  },
  {
    id: "nut4",
    name: "Condroitina",
    description: "Glicosaminoglicano sulfatado natural das cartilagens que auxilia na elasticidade e compressão",
    benefits: ["Manutenção da estrutura cartilaginosa", "Redução da degradação articular", "Efeito anti-inflamatório"],
    dosage: "10-15mg/kg de peso/dia",
    contraindications: ["Coagulopatias"],
    source: "Cartilagem de tubarão, bovina ou suína",
    chemicalCompound: "Polímero linear de N-acetilgalactosamina e ácido glucurônico sulfatado",
    condition: "Osteoartrite canina",
    preventionConditions: [
      { name: "Osteoartrite canina", efficacyScore: 3.5 },
      { name: "Degeneração articular", efficacyScore: 3.7 },
      { name: "Problemas articulares", efficacyScore: 3.4 }
    ],
    treatmentConditions: [
      { name: "Osteoartrite canina", efficacyScore: 4.1 },
      { name: "Degeneração articular", efficacyScore: 3.9 },
      { name: "Dor articular", efficacyScore: 3.8 }
    ],
    supportConditions: [
      { name: "Osteoartrite canina", efficacyScore: 3.6 },
      { name: "Estrutura cartilaginosa", efficacyScore: 3.5 },
      { name: "Saúde articular", efficacyScore: 3.7 }
    ],
    activeIngredients: ["Sulfato de condroitina", "Polissacarídeos sulfatados", "Glicosaminoglicanos"],
    scientificEvidence: {
      efficacyScore: 3.7,
      sustainabilityScore: 3.5,
      studies: [
        {
          title: "Chondroitin sulfate efficacy in canine joint disease: a systematic review",
          link: "https://doi.org/10.1111/jsap.13384",
          year: 2021
        },
        {
          title: "Synergistic effects of chondroitin with glucosamine in osteoarthritic dogs",
          link: "https://doi.org/10.1111/vcp.12563",
          year: 2023
        }
      ]
    }
  }
];
