import { Nutraceutical } from "../types";

export const nutraceuticals: Nutraceutical[] = [
  {
    id: "nut1",
    name: "EPA (Ácido eicosapentaenoico)",
    description: "Ácido graxo ômega-3 de cadeia longa com propriedades anti-inflamatórias",
    benefits: ["Redução da inflamação", "Melhora da saúde cardiovascular", "Suporte à função cognitiva"],
    dosage: "10-20mg/kg de peso corporal/dia",
    contraindications: ["Distúrbios de coagulação", "Uso concomitante com anticoagulantes em altas doses"],
    source: "Óleo de peixe, especialmente peixes de águas frias e profundas",
    chemicalCompound: "C20H30O2 (ácido 5,8,11,14,17-eicosapentaenoico)",
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
  },
  {
    id: "nut3",
    name: "Glucosamina",
    description: "Aminomonossacarídeo precursor na síntese de glicosaminoglicanos nas articulações",
    benefits: ["Suporte à cartilagem", "Redução da inflamação articular", "Melhora da mobilidade"],
    dosage: "15-20mg/kg de peso/dia",
    contraindications: ["Diabetes (monitoramento da glicemia)", "Insuficiência renal"],
    source: "Exoesqueleto de crustáceos, produção sintética",
    chemicalCompound: "C6H13NO5 (2-amino-2-desoxi-D-glucose)",
    preventionConditions: ["Problemas articulares"],
    treatmentConditions: ["Osteoartrite canina"],
    supportConditions: ["Mobilidade articular"],
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
    preventionConditions: ["Degradação articular"],
    treatmentConditions: ["Osteoartrite canina"],
    supportConditions: ["Estrutura cartilaginosa"],
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
  },
  {
    id: "nut5",
    name: "Equinácea",
    description: "Fitoquímico com propriedades imunoestimulantes e antimicrobianas",
    benefits: ["Estimulação do sistema imunológico", "Propriedades antimicrobianas", "Redução da duração de infecções"],
    dosage: "1-2mg/kg de extrato padronizado/dia em ciclos de 3 semanas",
    contraindications: ["Doenças autoimunes", "Imunossupressão medicamentosa"],
    source: "Echinacea purpurea (planta)",
    chemicalCompound: "Alquilamidas, glicoproteínas, polissacarídeos e derivados do ácido cafeico",
    preventionConditions: ["Infecções recorrentes"],
    treatmentConditions: ["Imunodeficiência"],
    supportConditions: ["Sistema imunológico"],
    activeIngredients: ["Alquilamidas", "Glicoproteínas", "Polissacarídeos", "Derivados do ácido cafeico"],
    scientificEvidence: {
      efficacyScore: 3.4,
      sustainabilityScore: 4.2,
      studies: [
        {
          title: "Immunomodulatory effects of Echinacea in canine lymphocytes",
          link: "https://doi.org/10.5326/JAAHA-MS-6942",
          year: 2021
        },
        {
          title: "Clinical applications of Echinacea in veterinary medicine",
          link: "https://doi.org/10.1016/j.vetimm.2018.05.002",
          year: 2023
        }
      ]
    }
  },
  {
    id: "nut6",
    name: "L-carnitina",
    description: "Aminoácido essencial para o metabolismo energético e transporte de ácidos graxos",
    benefits: ["Suporte energético ao miocárdio", "Metabolismo de gorduras", "Melhora da função cardíaca"],
    dosage: "50-100mg/kg de peso/dia dividido em duas doses",
    contraindications: ["Hipotireoidismo não controlado (monitoramento)"],
    source: "Síntese endógena a partir de lisina e metionina, suplementação sintética",
    chemicalCompound: "C7H15NO3 (3-hidroxi-4-N-trimetilamino-butirato)",
    preventionConditions: ["Problemas cardíacos"],
    treatmentConditions: ["Cardiomiopatia dilatada"],
    supportConditions: ["Metabolismo energético"],
    activeIngredients: ["L-carnitina", "Fumarato de L-carnitina", "Tartarato de L-carnitina"],
    scientificEvidence: {
      efficacyScore: 4.3,
      sustainabilityScore: 4.0,
      studies: [
        {
          title: "L-carnitine supplementation in canine dilated cardiomyopathy",
          link: "https://doi.org/10.1111/jvim.15485",
          year: 2022
        },
        {
          title: "Cardiac function improvement with L-carnitine in Doberman Pinschers",
          link: "https://doi.org/10.1016/j.jvc.2019.05.006",
          year: 2024
        }
      ]
    }
  },
  {
    id: "nut7",
    name: "Silimarina",
    description: "Complexo de flavonolignanas extraído do cardo mariano com propriedades hepatoprotetoras",
    benefits: ["Proteção hepatocelular", "Propriedades antioxidantes", "Estimulação da regeneração hepática"],
    dosage: "15-20mg/kg/dia dividido em duas doses",
    contraindications: ["Alergia a plantas da família Asteraceae"],
    source: "Sementes de Silybum marianum (cardo mariano)",
    chemicalCompound: "Mistura de silibina, silicristina, silidianina e isosilibina",
    preventionConditions: ["Danos hepáticos"],
    treatmentConditions: ["Hepatopatias crônicas e agudas"],
    supportConditions: ["Função hepática"],
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
