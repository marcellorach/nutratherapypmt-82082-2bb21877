
import { Nutraceutical } from "../../types";

export const longevityNutraceuticals: Nutraceutical[] = [
  {
    id: "nut10",
    name: "NMN (Nicotinamida Mononucleotídeo)",
    description: "Precursor do NAD+, importante para o metabolismo celular e longevidade",
    benefits: ["Aumento dos níveis de NAD+", "Melhora do metabolismo energético", "Suporte à longevidade celular"],
    dosage: "1-2mg/kg/dia",
    contraindications: ["Gestação", "Lactação"],
    source: "Síntese laboratorial",
    chemicalCompound: "C11H15N2O8P",
    condition: "Envelhecimento celular",
    preventionConditions: ["Envelhecimento precoce"],
    treatmentConditions: ["Declínio metabólico relacionado à idade"],
    supportConditions: ["Metabolismo energético"],
    activeIngredients: ["Nicotinamida Mononucleotídeo"],
    scientificEvidence: {
      efficacyScore: 3.2,
      sustainabilityScore: 3.5,
      studies: [
        {
          title: "NMN supplementation effects on aging biomarkers in dogs",
          link: "https://doi.org/10.xxxx/yyyy",
          year: 2024
        }
      ]
    }
  },
  {
    id: "nut11",
    name: "Resveratrol",
    description: "Polifenol com propriedades antioxidantes e ativadoras das sirtuínas",
    benefits: ["Ativação de sirtuínas", "Proteção antioxidante", "Suporte cardiovascular"],
    dosage: "5-10mg/kg/dia",
    contraindications: ["Uso concomitante com anticoagulantes"],
    source: "Uvas, vinho tinto, polygonum cuspidatum",
    chemicalCompound: "C14H12O3",
    condition: "Envelhecimento oxidativo",
    preventionConditions: ["Estresse oxidativo"],
    treatmentConditions: ["Envelhecimento celular"],
    supportConditions: ["Função mitocondrial"],
    activeIngredients: ["Trans-resveratrol"],
    scientificEvidence: {
      efficacyScore: 3.8,
      sustainabilityScore: 4.0,
      studies: [
        {
          title: "Resveratrol effects on canine longevity markers",
          link: "https://doi.org/10.xxxx/zzzz",
          year: 2023
        }
      ]
    }
  }
];
