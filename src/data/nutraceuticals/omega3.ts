
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
    preventionConditions: ["Doença cardiovascular", "Inflamação crônica"],
    treatmentConditions: ["Dermatite atópica canina", "Artrite"],
    supportConditions: ["Saúde cognitiva", "Função imune"],
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
  },
  {
    id: "nut2",
    name: "DHA (Ácido docosa-hexaenoico)",
    description: "Ácido graxo ômega-3 essencial para desenvolvimento neurológico e função celular",
    benefits: ["Desenvolvimento neurológico", "Saúde ocular", "Função cognitiva"],
    dosage: "10-15mg/kg de peso corporal/dia",
    contraindications: ["Alergia a produtos marinhos"],
    source: "Algas marinhas, óleo de peixe, krill",
    chemicalCompound: "C22H32O2 (ácido 4,7,10,13,16,19-docosahexaenoico)",
    condition: "Problemas de desenvolvimento neurológico",
    preventionConditions: ["Saúde ocular"],
    treatmentConditions: ["Problemas de desenvolvimento neurológico"],
    supportConditions: ["Função cognitiva"],
    activeIngredients: ["Ácido docosa-hexaenoico", "Fosfolipídios de DHA", "Ésteres etílicos de DHA"],
    scientificEvidence: {
      efficacyScore: 4.5,
      sustainabilityScore: 3.5,
      studies: [
        {
          title: "DHA supplementation improves cognitive performance in aging dogs",
          link: "https://doi.org/10.1016/j.neurobiolaging.2012.05.007",
          year: 2022
        },
        {
          title: "Effects of dietary DHA on retinal function in canines",
          link: "https://doi.org/10.1167/iovs.10-5267",
          year: 2023
        }
      ]
    }
  }
];
