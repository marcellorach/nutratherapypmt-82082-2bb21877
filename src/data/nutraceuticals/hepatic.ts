
import { Nutraceutical } from "../../types";

export const hepaticNutraceuticals: Nutraceutical[] = [
  {
    id: "nut7",
    name: "Silimarina",
    description: "Complexo de flavonolignanas extraído do cardo mariano com propriedades hepatoprotetoras",
    benefits: ["Proteção hepatocelular", "Propriedades antioxidantes", "Estimulação da regeneração hepática"],
    dosage: "15-20mg/kg/dia dividido em duas doses",
    contraindications: ["Alergia a plantas da família Asteraceae"],
    source: "Sementes de Silybum marianum (cardo mariano)",
    chemicalCompound: "Mistura de silibina, silicristina, silidianina e isosilibina",
    condition: "Hepatopatias crônicas e agudas",
    preventionConditions: [
      { name: "Danos hepáticos", efficacyScore: 3.9 }
    ],
    treatmentConditions: [
      { name: "Hepatopatias crônicas e agudas", efficacyScore: 4.1 }
    ],
    supportConditions: [
      { name: "Função hepática", efficacyScore: 3.8 }
    ],
    activeIngredients: ["Silibina", "Silicristina", "Silidianina", "Isosilibina"],
    scientificEvidence: {
      efficacyScore: 4.1,
      sustainabilityScore: 3.9,
      studies: [
        {
          title: "Clinical evaluation of silymarin in canine hepatic lipidosis",
          link: "https://doi.org/10.1111/jvim.15788",
          year: 2023
        },
        {
          title: "Silymarin hepatoprotective effects in drug-induced liver injury in dogs",
          link: "https://doi.org/10.1111/jsap.13268",
          year: 2022
        }
      ]
    }
  }
];
