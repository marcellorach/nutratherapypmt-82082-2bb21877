import { Pet, Owner, ExamResult, Nutraceutical, Recommendation, TreatmentPlan } from "../types";

// Mock Owners
export const owners: Owner[] = [
  {
    id: "own1",
    name: "João Silva",
    email: "joao@email.com",
    phone: "(11) 99999-9999"
  },
  {
    id: "own2",
    name: "Maria Souza",
    email: "maria@email.com",
    phone: "(11) 88888-8888"
  },
  {
    id: "own3",
    name: "Pedro Santos",
    email: "pedro@email.com",
    phone: "(11) 77777-7777"
  },
  {
    id: "own4",
    name: "Ana Oliveira",
    email: "ana@email.com",
    phone: "(11) 66666-6666"
  },
  {
    id: "own5",
    name: "Carlos Mendes",
    email: "carlos@email.com",
    phone: "(11) 55555-5555"
  }
];

// Mock Pets - Apenas cães
export const pets: Pet[] = [
  {
    id: "pet1",
    name: "Rex",
    species: "Cachorro",
    breed: "Labrador",
    age: 5,
    weight: 25,
    ownerId: "own1",
    imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2274&q=80",
    chipNumber: "BR12345678",
    petLovePlan: "Premium",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 2
  },
  {
    id: "pet2",
    name: "Luna",
    species: "Cachorro",
    breed: "Poodle",
    age: 3,
    weight: 8,
    ownerId: "own2",
    imageUrl: "https://images.unsplash.com/photo-1594922009922-d1665a492c40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
    chipNumber: "BR87654321",
    petLovePlan: "Básico",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 1
  },
  {
    id: "pet4",
    name: "Thor",
    species: "Cachorro",
    breed: "Golden Retriever",
    age: 4,
    weight: 28,
    ownerId: "own3",
    imageUrl: "https://images.unsplash.com/photo-1600077106724-946750eeaf3c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1780&q=80",
    chipNumber: "BR98765432",
    petLovePlan: "Premium",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 5
  },
  {
    id: "pet6",
    name: "Bidu",
    species: "Cachorro",
    breed: "Beagle",
    age: 6,
    weight: 12,
    ownerId: "own5",
    imageUrl: "https://images.unsplash.com/photo-1568572933382-74d440642117?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    chipNumber: "BR34567890",
    petLovePlan: "Completo",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 7
  },
  {
    id: "pet7",
    name: "Mel",
    species: "Cachorro",
    breed: "Shih Tzu",
    age: 2,
    weight: 5.5,
    ownerId: "own4",
    imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1964&q=80",
    chipNumber: "BR56789012",
    petLovePlan: "Premium",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 4
  },
  {
    id: "pet8",
    name: "Tobby",
    species: "Cachorro",
    breed: "Bulldog",
    age: 3,
    weight: 22,
    ownerId: "own3",
    imageUrl: "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1976&q=80",
    chipNumber: "BR67890123",
    petLovePlan: "Básico",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 1
  },
  {
    id: "pet9",
    name: "Max",
    species: "Cachorro",
    breed: "Pastor Alemão",
    age: 4,
    weight: 32,
    ownerId: "own2",
    imageUrl: "https://images.unsplash.com/photo-1553882809-a4f57e59501d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2274&q=80",
    chipNumber: "BR78901234",
    petLovePlan: "Premium",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 3
  },
  {
    id: "pet10",
    name: "Billy",
    species: "Cachorro",
    breed: "Dálmata",
    age: 2,
    weight: 27,
    ownerId: "own5",
    imageUrl: "https://images.unsplash.com/photo-1597283712405-819a6027dcb4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
    chipNumber: "BR89012345",
    petLovePlan: "Completo",
    veterinarianId: "vet1",
    veterinarianName: "Dr. Ricardo Alves",
    reviewDays: 10
  }
];

// Mock Exam Results
export const examResults: ExamResult[] = [
  {
    id: "exm1",
    petId: "pet1",
    date: "2025-03-15",
    type: "Sangue",
    results: {
      hemoglobina: 14.5,
      leucócitos: 8500,
      plaquetas: 250000,
      vitamina_d: 25.3,
      cálcio: 8.9,
    },
    notes: "Níveis ligeiramente baixos de vitamina D."
  },
  {
    id: "exm2",
    petId: "pet2",
    date: "2025-04-01",
    type: "Sangue",
    results: {
      hemoglobina: 13.8,
      leucócitos: 9200,
      plaquetas: 200000,
      vitamina_d: 32.0,
      cálcio: 9.5,
    },
    notes: "Resultados normais."
  }
];

// Mock Nutraceuticals reformulados com princípios ativos
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

// Mock Recommendations - Atualizadas para usar os novos nutraceuticos
export const recommendations: Recommendation[] = [
  {
    id: "rec1",
    petId: "pet1",
    nutraceuticalId: "nut1",
    reason: "Dermatite atópica recorrente com ressecamento da pelagem",
    dosage: "30mg/kg/dia (dividido em duas administrações)",
    duration: "3 meses",
    startDate: "2025-04-15",
    priority: 1
  },
  {
    id: "rec2",
    petId: "pet1",
    nutraceuticalId: "nut3",
    reason: "Fortalecimento do sistema imunológico após infecção recente",
    dosage: "300mg/kg/dia do complexo imunomodulador",
    duration: "2 meses",
    startDate: "2025-04-15",
    priority: 2
  },
  {
    id: "rec3",
    petId: "pet2",
    nutraceuticalId: "nut2",
    reason: "Prevenção de problemas articulares comuns na raça",
    dosage: "20mg/kg/dia de sulfato de condroitina e 15mg/kg/dia de glucosamina",
    duration: "Contínuo",
    startDate: "2025-04-10",
    priority: 1
  },
  {
    id: "rec4",
    petId: "pet4",
    nutraceuticalId: "nut1",
    reason: "Melhoria da pelagem e prevenção de alergias sazonais",
    dosage: "25mg/kg/dia de ácidos graxos essenciais",
    duration: "6 meses",
    startDate: "2025-03-22",
    priority: 2
  },
  {
    id: "rec5",
    petId: "pet6",
    nutraceuticalId: "nut4",
    reason: "Prevenção de problemas cardíacos comuns em Beagles",
    dosage: "40mg/kg/dia de L-carnitina e 1.5mg/kg/dia de coenzima Q10",
    duration: "Contínuo",
    startDate: "2025-04-01",
    priority: 1
  },
  {
    id: "rec6",
    petId: "pet7",
    nutraceuticalId: "nut5",
    reason: "Prevenção de tártaro e problemas periodontais",
    dosage: "Solução 0.12% aplicada diariamente nas gengivas",
    duration: "Contínuo",
    startDate: "2025-03-15",
    priority: 3
  },
  {
    id: "rec7",
    petId: "pet8",
    nutraceuticalId: "nut2",
    reason: "Prevenção de problemas articulares devido ao peso",
    dosage: "25mg/kg/dia de sulfato de condroitina e 20mg/kg/dia de glucosamina",
    duration: "Contínuo",
    startDate: "2025-04-05",
    priority: 1
  },
  {
    id: "rec8",
    petId: "pet10",
    nutraceuticalId: "nut3",
    reason: "Fortalecimento imunológico preventivo",
    dosage: "350mg/kg/dia de complexo imunomodulador",
    duration: "3 meses",
    startDate: "2025-04-12",
    priority: 2
  },
  {
    id: "rec9",
    petId: "pet6",
    nutraceuticalId: "nut7",
    reason: "Suporte cognitivo para envelhecimento saudável",
    dosage: "30mg/kg/dia do complexo neuroprotetor",
    duration: "Contínuo",
    startDate: "2025-04-02",
    priority: 2
  },
  {
    id: "rec10",
    petId: "pet1",
    nutraceuticalId: "nut6",
    reason: "Suporte hepático após tratamento medicamentoso prolongado",
    dosage: "18mg/kg/dia de silimarina, dividido em duas doses",
    duration: "45 dias",
    startDate: "2025-04-20",
    priority: 3
  }
];

// Mock Treatment Plans - Atualizado para incluir as novas recomendações
export const treatmentPlans: TreatmentPlan[] = [
  {
    id: "pln1",
    petId: "pet1",
    veterinarianId: "vet1",
    createdAt: "2025-04-05",
    recommendations: [
      {
        id: "rec1",
        petId: "pet1",
        nutraceuticalId: "nut1",
        reason: "Dermatite atópica recorrente com ressecamento da pelagem",
        dosage: "30mg/kg/dia (dividido em duas administrações)",
        duration: "3 meses",
        startDate: "2025-04-15",
        priority: 1
      },
      {
        id: "rec2",
        petId: "pet1",
        nutraceuticalId: "nut3",
        reason: "Fortalecimento do sistema imunológico após infecção recente",
        dosage: "300mg/kg/dia do complexo imunomodulador",
        duration: "2 meses",
        startDate: "2025-04-15",
        priority: 2
      },
      {
        id: "rec10",
        petId: "pet1",
        nutraceuticalId: "nut6",
        reason: "Suporte hepático após tratamento medicamentoso prolongado",
        dosage: "18mg/kg/dia de silimarina, dividido em duas doses",
        duration: "45 dias",
        startDate: "2025-04-20",
        priority: 3
      }
    ],
    notes: "Reavaliar após 1 mês para ajustes na dosagem se necessário. Monitorar enzimas hepáticas antes e após tratamento com silimarina."
  },
  {
    id: "pln2",
    petId: "pet2",
    veterinarianId: "vet1",
    createdAt: "2025-04-02",
    recommendations: [
      {
        id: "rec3",
        petId: "pet2",
        nutraceuticalId: "nut2",
        reason: "Prevenção de problemas articulares comuns na raça",
        dosage: "20mg/kg/dia de sulfato de condroitina e 15mg/kg/dia de glucosamina",
        duration: "Contínuo",
        startDate: "2025-04-10",
        priority: 1
      }
    ],
    notes: "Monitorar mobilidade e disposição do animal. Considerar adição de ácidos graxos essenciais em 3 meses."
  },
  {
    id: "pln3",
    petId: "pet4",
    veterinarianId: "vet1",
    createdAt: "2025-03-20",
    recommendations: [
      {
        id: "rec4",
        petId: "pet4",
        nutraceuticalId: "nut1",
        reason: "Melhoria da pelagem e prevenção de alergias sazonais",
        dosage: "25mg/kg/dia de ácidos graxos essenciais",
        duration: "6 meses",
        startDate: "2025-03-22",
        priority: 2
      }
    ],
    notes: "Atentar para possíveis reações alérgicas nos primeiros dias. Avaliar qualidade da pelagem após 2 meses."
  },
  {
    id: "pln4",
    petId: "pet6",
    veterinarianId: "vet1",
    createdAt: "2025-03-30",
    recommendations: [
      {
        id: "rec5",
        petId: "pet6",
        nutraceuticalId: "nut4",
        reason: "Prevenção de problemas cardíacos comuns em Beagles",
        dosage: "40mg/kg/dia de L-carnitina e 1.5mg/kg/dia de coenzima Q10",
        duration: "Contínuo",
        startDate: "2025-04-01",
        priority: 1
      },
      {
        id: "rec9",
        petId: "pet6",
        nutraceuticalId: "nut7",
        reason: "Suporte cognitivo para envelhecimento saudável",
        dosage: "30mg/kg/dia do complexo neuroprotetor",
        duration: "Contínuo",
        startDate: "2025-04-02",
        priority: 2
      }
    ],
    notes: "Verificar frequência cardíaca mensalmente. Avaliar responsividade e cognição a cada 3 meses."
  },
  {
    id: "pln5",
    petId: "pet7",
    veterinarianId: "vet1",
    createdAt: "2025-03-12",
    recommendations: [
      {
        id: "rec6",
        petId: "pet7",
        nutraceuticalId: "nut5",
        reason: "Prevenção de tártaro e problemas periodontais",
        dosage: "Solução 0.12% aplicada diariamente nas gengivas",
        duration: "Contínuo",
        startDate: "2025-03-15",
        priority: 3
      }
    ],
    notes: "Avaliar condições bucais após 60 dias de uso. Recomendar limpeza profissional se necessário."
  },
  {
    id: "pln6",
    petId: "pet8",
    veterinarianId: "vet1",
    createdAt: "2025-04-03",
    recommendations: [
      {
        id: "rec7",
        petId: "pet8",
        nutraceuticalId: "nut2",
        reason: "Prevenção de problemas articulares devido ao peso",
        dosage: "25mg/kg/dia de sulfato de condroitina e 20mg/kg/dia de glucosamina",
        duration: "Contínuo",
        startDate: "2025-04-05",
        priority: 1
      }
    ],
    notes: "Associar a recomendação com orientações de dieta e exercícios. Monitorar peso mensalmente."
  },
  {
    id: "pln7",
    petId: "pet10",
    veterinarianId: "vet1",
    createdAt: "2025-04-10",
    recommendations: [
      {
        id: "rec8",
        petId: "pet10",
        nutraceuticalId: "nut3",
        reason: "Fortalecimento imunológico preventivo",
        dosage: "350mg/kg/dia de complexo imunomodulador",
        duration: "3 meses",
        startDate: "2025-04-12",
        priority: 2
      }
    ],
    notes: "Monitorar energia e disposição durante o tratamento. Realizar hemograma completo após 3 meses."
  }
];

// Função para gerar dados aleatórios de exemplo
export const generateRandomData = () => {
  alert("Dados de exemplo gerados com sucesso!");
  return {
    pets,
    owners,
    examResults,
    nutraceuticals,
    recommendations,
    treatmentPlans
  };
};
