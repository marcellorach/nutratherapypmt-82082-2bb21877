
import { Nutraceutical } from "../types";

// Mock Nutraceuticals
export const nutraceuticals: Nutraceutical[] = [
  {
    id: "nut1",
    name: "Ácidos graxos essenciais",
    description: "Combinação de EPA e DHA para saúde dermatológica e redução de inflamação",
    benefits: ["Melhora saúde da pele", "Reduz inflamação crônica", "Fortalece barreira cutânea"],
    dosage: "20-40mg/kg de peso corporal/dia",
    contraindications: ["Distúrbios de coagulação", "Pancreatite aguda"],
    activeIngredients: ["Ácido eicosapentaenoico (EPA)", "Ácido docosa-hexaenoico (DHA)"],
    condition: "Dermatite atópica canina",
    scientificEvidence: {
      efficacyScore: 4.2,
      sustainabilityScore: 3.8,
      studies: [
        {
          title: "Long-chain omega-3 fatty acids and inflammatory dermatoses in dogs",
          link: "https://doi.org/10.1111/j.1365-2885.2010.01226.x",
          year: 2023
        },
        {
          title: "Effects of dietary supplementation with fish oil on clinical manifestations of canine atopic dermatitis",
          link: "https://doi.org/10.1111/j.1748-5827.2001.tb02492.x",
          year: 2022
        }
      ]
    }
  },
  {
    id: "nut2",
    name: "Glicosaminoglicanos e Condroitina",
    description: "Complexo de suporte articular com propriedades condroprotetoras",
    benefits: ["Estimula síntese de cartilagem", "Reduz degradação articular", "Melhora mobilidade"],
    dosage: "15-30mg/kg de sulfato de condroitina e 10-15mg/kg de glucosamina diariamente",
    contraindications: ["Insuficiência renal grave", "Coagulopatias"],
    activeIngredients: ["Sulfato de glucosamina", "Sulfato de condroitina", "MSM (metilsulfonilmetano)"],
    condition: "Osteoartrite canina",
    scientificEvidence: {
      efficacyScore: 3.9,
      sustainabilityScore: 4.1,
      studies: [
        {
          title: "Randomized, controlled trial of glucosamine/chondroitin for treating dogs with osteoarthritis",
          link: "https://doi.org/10.2460/javma.2007.230.514",
          year: 2024
        },
        {
          title: "Evaluation of the effects of glycosaminoglycan polysulfate on progression of osteoarthritis in a canine model",
          link: "https://doi.org/10.1111/j.1532-950X.1992.tb00086.x",
          year: 2022
        }
      ]
    }
  },
  {
    id: "nut3",
    name: "Complexo Imunomodulador",
    description: "Blend de antioxidantes e prebióticos para equilíbrio imunológico",
    benefits: ["Modula resposta imune", "Potencializa defesas naturais", "Reduz estresse oxidativo"],
    dosage: "200-400mg/kg de peso/dia de extrato de equinácea e 10-20mg/kg de beta-glucanos",
    contraindications: ["Doenças autoimunes não controladas", "Imunossupressão medicamentosa"],
    activeIngredients: ["Equinácea purpurea", "Beta-glucanos", "Vitamina C", "Zinco quelado"],
    condition: "Imunodeficiência e susceptibilidade a infecções",
    scientificEvidence: {
      efficacyScore: 3.6,
      sustainabilityScore: 3.2,
      studies: [
        {
          title: "Immunomodulatory effects of beta-glucan in canine leukocytes",
          link: "https://doi.org/10.1016/j.vetimm.2015.06.003",
          year: 2021
        },
        {
          title: "Evaluation of Echinacea as an immunostimulatory agent in healthy dogs",
          link: "https://doi.org/10.5326/JAAHA-MS-6942",
          year: 2023
        }
      ]
    }
  },
  {
    id: "nut4",
    name: "Formulação Cardioprotetora",
    description: "Combinação de compostos para suporte da função cardíaca",
    benefits: ["Suporte energético ao miocárdio", "Melhora contratilidade", "Regula pressão arterial"],
    dosage: "30-50mg/kg/dia de L-carnitina e 1-2mg/kg/dia de coenzima Q10",
    contraindications: ["Hipersensibilidade aos componentes", "Monitoramento em terapias com digitálicos"],
    activeIngredients: ["L-carnitina", "Coenzima Q10", "Taurina", "Ácido alfa-lipoico"],
    condition: "Cardiomiopatia dilatada e insuficiência cardíaca",
    scientificEvidence: {
      efficacyScore: 4.3,
      sustainabilityScore: 4.0,
      studies: [
        {
          title: "Effects of coenzyme Q10 and taurine in canine dilated cardiomyopathy",
          link: "https://doi.org/10.1111/jvim.15485",
          year: 2022
        },
        {
          title: "L-carnitine supplementation in canine cardiac patients: A systematic review",
          link: "https://doi.org/10.1016/j.jvc.2019.05.006",
          year: 2024
        }
      ]
    }
  },
  {
    id: "nut5",
    name: "Fitocomplexo Periodontal",
    description: "Blend de extratos vegetais com ação antimicrobiana e anti-inflamatória para saúde bucal",
    benefits: ["Reduz formação de biofilme", "Controla proliferação bacteriana", "Minimiza inflamação gengival"],
    dosage: "Solução de 0.12% para aplicação diária ou adição de 2-5ml à água de bebida",
    contraindications: ["Hipersensibilidade aos componentes botânicos"],
    activeIngredients: ["Melaleuca alternifolia", "Sálvia officinalis", "Clorexidina em baixa concentração", "Zinco gluconato"],
    condition: "Doença periodontal canina",
    scientificEvidence: {
      efficacyScore: 3.4,
      sustainabilityScore: 3.7,
      studies: [
        {
          title: "Clinical evaluation of herbal mouth rinses in controlling canine periodontal disease",
          link: "https://doi.org/10.1111/jsap.13054",
          year: 2021
        },
        {
          title: "Effects of a botanical oral care gel on periodontal health indicators in dogs",
          link: "https://doi.org/10.2460/javma.255.11.1278",
          year: 2023
        }
      ]
    }
  },
  {
    id: "nut6",
    name: "Suporte Hepatobiliar",
    description: "Formulação hepatoprotetora com silimarina e aminoácidos essenciais",
    benefits: ["Proteção hepatocelular", "Estimulação da regeneração hepática", "Suporte à desintoxicação"],
    dosage: "15-20mg/kg/dia de silimarina, dividido em duas doses",
    contraindications: ["Obstrução biliar completa", "Alergia a plantas da família Asteraceae"],
    activeIngredients: ["Silimarina (Silybum marianum)", "S-adenosilmetionina (SAMe)", "N-acetilcisteína", "Fosfatidilcolina"],
    condition: "Hepatopatias crônicas e agudas",
    scientificEvidence: {
      efficacyScore: 4.1,
      sustainabilityScore: 3.9,
      studies: [
        {
          title: "Clinical evaluation of silymarin in the treatment of canine hepatic lipidosis",
          link: "https://doi.org/10.1111/jvim.15788",
          year: 2023
        },
        {
          title: "S-adenosylmethionine (SAMe) for the treatment of chronic hepatopathies in dogs: a systematic review",
          link: "https://doi.org/10.1111/jsap.13268",
          year: 2022
        }
      ]
    }
  },
  {
    id: "nut7",
    name: "Complexo Neuroprotetor",
    description: "Combinação de antioxidantes e ácidos graxos para função cognitiva",
    benefits: ["Melhora função cognitiva", "Reduz estresse oxidativo cerebral", "Suporte à neurotransmissão"],
    dosage: "20-40mg/kg/dia de extratos combinados, ajustável conforme peso e idade",
    contraindications: ["Monitoramento em cães com epilepsia"],
    activeIngredients: ["Ginkgo biloba", "Ácidos graxos ômega-3", "Fosfolipídeos", "Antioxidantes (vitamina E, selênio)"],
    condition: "Disfunção cognitiva canina",
    scientificEvidence: {
      efficacyScore: 3.8,
      sustainabilityScore: 3.5,
      studies: [
        {
          title: "Effects of dietary supplementation with medium-chain TAG on canine cognitive dysfunction syndrome",
          link: "https://doi.org/10.1017/S0007114510000097",
          year: 2024
        },
        {
          title: "Neuroprotective effects of antioxidant supplementation in aged dogs",
          link: "https://doi.org/10.1111/jvim.16055",
          year: 2022
        }
      ]
    }
  }
];
