
import { Nutraceutical } from "../../types";

export const immuneModulatorNutraceuticals: Nutraceutical[] = [
  {
    id: "nut18",
    name: "Beta-Glucanas",
    description: "Polissacarídeos com propriedades imunomoduladoras e prebióticas",
    benefits: ["Modulação imunológica", "Saúde intestinal", "Propriedades prebióticas"],
    dosage: "25-50mg/kg/dia",
    contraindications: ["Doenças autoimunes ativas", "Imunossupressão medicamentosa"],
    source: "Parede celular de leveduras, cogumelos, aveia",
    chemicalCompound: "Polímero de β(1→3) e β(1→6)-D-glucano",
    condition: "Imunomodulação",
    preventionConditions: [
      { name: "Infecções", efficacyScore: 3.8 },
      { name: "Câncer", efficacyScore: 3.2 }
    ],
    treatmentConditions: [],
    supportConditions: [
      { name: "Suporte Imunológico", efficacyScore: 3.0 },
      { name: "Saúde intestinal", efficacyScore: 3.2 },
      { name: "Resposta imune", efficacyScore: 3.8 }
    ],
    activeIngredients: ["β(1→3)-glucanos", "β(1→6)-glucanos", "Manoproteínas"],
    scientificEvidence: {
      efficacyScore: 3.4,
      sustainabilityScore: 4.1,
      studies: [
        {
          title: "Beta-glucan immunomodulation in canine immune response",
          link: "https://doi.org/10.1016/j.vetimm.2022.110441",
          year: 2023
        },
        {
          title: "Yeast beta-glucans in companion animal nutrition: immune effects",
          link: "https://doi.org/10.1111/jpn.13652",
          year: 2022
        }
      ]
    }
  }
];
