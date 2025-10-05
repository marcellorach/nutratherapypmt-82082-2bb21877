
import { Study } from "../types/oraBiomedical";

// Dados de exemplo
export const ongoingStudies: Study[] = [
  {
    id: "ora-1",
    title: "Análise de flavonoides em longevidade de C. elegans",
    description: "Avaliação de 60 flavonoides naturais e seus efeitos na extensão do tempo de vida de C. elegans",
    startDate: "2025-03-01",
    progress: 68,
    compounds: 60,
    positiveResults: 12,
    status: 'ongoing',
    primaryInvestigator: "Dra. Marina Souza",
    priority: 'high'
  },
  {
    id: "ora-2",
    title: "Efeitos de polifenóis na função mitocondrial",
    description: "Investigação de compostos polifenólicos e seus efeitos na biogênese e função mitocondrial",
    startDate: "2025-02-15",
    progress: 42,
    compounds: 45,
    positiveResults: 8,
    status: 'ongoing',
    primaryInvestigator: "Dr. Felipe Mendes",
    priority: 'medium',
    alerts: 2
  },
  {
    id: "ora-3",
    title: "Avaliação de antibióticos na expressão de genes de longevidade",
    description: "Teste de 32 antibióticos e seus efeitos moduladores na expressão de genes relacionados à longevidade",
    startDate: "2025-03-10",
    progress: 25,
    compounds: 32,
    positiveResults: 3,
    status: 'ongoing',
    primaryInvestigator: "Dra. Carla Batista",
    priority: 'medium'
  },
  {
    id: "ora-4",
    title: "Peptídeos bioativos e resistência ao estresse oxidativo",
    description: "Screening de peptídeos com potencial antioxidante e efeitos na resistência ao estresse celular",
    startDate: "2025-03-20",
    progress: 12,
    compounds: 28,
    positiveResults: 2,
    status: 'ongoing',
    primaryInvestigator: "Dr. Ricardo Torres",
    priority: 'high',
    alerts: 1
  }
];

export const completedStudies: Study[] = [
  {
    id: "ora-c1",
    title: "Impacto de inibidores de mTOR na longevidade",
    title_pt: "Impacto de inibidores de mTOR na longevidade",
    title_en: "Impact of mTOR inhibitors on longevity",
    description: "Avaliação de análogos de rapamicina na extensão de vida de C. elegans",
    description_pt: "Avaliação de análogos de rapamicina na extensão de vida de C. elegans",
    description_en: "Evaluation of rapamycin analogs on C. elegans lifespan extension",
    startDate: "2024-09-05",
    endDate: "2025-01-15",
    progress: 100,
    compounds: 22,
    positiveResults: 7,
    status: 'completed',
    primaryInvestigator: "Dr. André Correia",
    priority: 'medium',
    studyPopulation: 100,
    duration: "21 dias",
    duration_pt: "21 dias",
    duration_en: "21 days",
    category: 'geroproptetor',
    quantitativeResults: {
      lifeExtension: "+23.5%",
      lifeExtension_pt: "+23.5% no grupo tratamento",
      lifeExtension_en: "+23.5% in treatment group",
      pValue: "< 0.001",
      statisticalPower: "95%",
      effect: "Extensão significativa da expectativa de vida",
      effect_pt: "Extensão significativa da expectativa de vida",
      effect_en: "Significant life expectancy extension"
    },
    interventionData: {
      earlyIntervention: {
        survivalRate: [
          { age: 0, control: 1.0, lowIntervention: 1.0, highIntervention: 1.0 },
          { age: 5, control: 0.98, lowIntervention: 0.99, highIntervention: 1.0 },
          { age: 10, control: 0.85, lowIntervention: 0.92, highIntervention: 0.95 },
          { age: 15, control: 0.65, lowIntervention: 0.80, highIntervention: 0.88 },
          { age: 20, control: 0.40, lowIntervention: 0.60, highIntervention: 0.75 },
          { age: 25, control: 0.20, lowIntervention: 0.35, highIntervention: 0.50 },
          { age: 30, control: 0.05, lowIntervention: 0.15, highIntervention: 0.25 },
          { age: 35, control: 0.0, lowIntervention: 0.02, highIntervention: 0.08 },
        ],
        healthyRate: [
          { age: 0, control: 1.0, lowIntervention: 1.0, highIntervention: 1.0 },
          { age: 5, control: 0.95, lowIntervention: 0.98, highIntervention: 1.0 },
          { age: 10, control: 0.80, lowIntervention: 0.90, highIntervention: 0.95 },
          { age: 15, control: 0.50, lowIntervention: 0.75, highIntervention: 0.85 },
          { age: 20, control: 0.20, lowIntervention: 0.50, highIntervention: 0.70 },
          { age: 25, control: 0.05, lowIntervention: 0.25, highIntervention: 0.40 },
          { age: 30, control: 0.0, lowIntervention: 0.10, highIntervention: 0.20 },
        ],
        stressResponseRate: [
          { age: 0, control: 1.0, lowIntervention: 1.0, highIntervention: 1.0 },
          { age: 5, control: 0.97, lowIntervention: 0.99, highIntervention: 1.0 },
          { age: 10, control: 0.83, lowIntervention: 0.91, highIntervention: 0.94 },
          { age: 15, control: 0.60, lowIntervention: 0.78, highIntervention: 0.85 },
          { age: 17, control: 0.40, lowIntervention: 0.68, highIntervention: 0.80 },
          { age: 20, control: 0.20, lowIntervention: 0.45, highIntervention: 0.65 },
          { age: 25, control: 0.05, lowIntervention: 0.25, highIntervention: 0.40 },
          { age: 30, control: 0.0, lowIntervention: 0.08, highIntervention: 0.20 },
        ],
        stressHealthyRate: [
          { age: 0, control: 1.0, lowIntervention: 1.0, highIntervention: 1.0 },
          { age: 5, control: 0.95, lowIntervention: 0.98, highIntervention: 1.0 },
          { age: 10, control: 0.80, lowIntervention: 0.90, highIntervention: 0.95 },
          { age: 15, control: 0.50, lowIntervention: 0.75, highIntervention: 0.85 },
          { age: 17, control: 0.30, lowIntervention: 0.60, highIntervention: 0.75 },
          { age: 20, control: 0.15, lowIntervention: 0.45, highIntervention: 0.60 },
          { age: 25, control: 0.05, lowIntervention: 0.20, highIntervention: 0.35 },
          { age: 30, control: 0.0, lowIntervention: 0.05, highIntervention: 0.15 },
        ]
      },
      midLifeIntervention: {
        survivalRate: [
          { age: 0, control: 1.0, lowIntervention: 1.0, highIntervention: 1.0 },
          { age: 5, control: 0.98, lowIntervention: 0.99, highIntervention: 0.99 },
          { age: 10, control: 0.85, lowIntervention: 0.90, highIntervention: 0.92 },
          { age: 15, control: 0.65, lowIntervention: 0.75, highIntervention: 0.82 },
          { age: 20, control: 0.40, lowIntervention: 0.55, highIntervention: 0.68 },
          { age: 25, control: 0.20, lowIntervention: 0.32, highIntervention: 0.45 },
          { age: 30, control: 0.05, lowIntervention: 0.14, highIntervention: 0.22 },
          { age: 35, control: 0.0, lowIntervention: 0.02, highIntervention: 0.07 },
        ],
        healthyRate: [
          { age: 0, control: 1.0, lowIntervention: 1.0, highIntervention: 1.0 },
          { age: 5, control: 0.95, lowIntervention: 0.97, highIntervention: 0.98 },
          { age: 10, control: 0.80, lowIntervention: 0.87, highIntervention: 0.90 },
          { age: 15, control: 0.50, lowIntervention: 0.70, highIntervention: 0.78 },
          { age: 20, control: 0.20, lowIntervention: 0.45, highIntervention: 0.58 },
          { age: 25, control: 0.05, lowIntervention: 0.22, highIntervention: 0.35 },
          { age: 30, control: 0.0, lowIntervention: 0.08, highIntervention: 0.18 },
        ],
        stressResponseRate: [
          { age: 0, control: 1.0, lowIntervention: 1.0, highIntervention: 1.0 },
          { age: 5, control: 0.97, lowIntervention: 0.98, highIntervention: 0.99 },
          { age: 10, control: 0.83, lowIntervention: 0.88, highIntervention: 0.91 },
          { age: 15, control: 0.60, lowIntervention: 0.72, highIntervention: 0.78 },
          { age: 17, control: 0.40, lowIntervention: 0.62, highIntervention: 0.72 },
          { age: 20, control: 0.20, lowIntervention: 0.40, highIntervention: 0.55 },
          { age: 25, control: 0.05, lowIntervention: 0.20, highIntervention: 0.35 },
          { age: 30, control: 0.0, lowIntervention: 0.06, highIntervention: 0.16 },
        ],
        stressHealthyRate: [
          { age: 0, control: 1.0, lowIntervention: 1.0, highIntervention: 1.0 },
          { age: 5, control: 0.95, lowIntervention: 0.97, highIntervention: 0.98 },
          { age: 10, control: 0.80, lowIntervention: 0.86, highIntervention: 0.88 },
          { age: 15, control: 0.50, lowIntervention: 0.68, highIntervention: 0.75 },
          { age: 17, control: 0.30, lowIntervention: 0.55, highIntervention: 0.68 },
          { age: 20, control: 0.15, lowIntervention: 0.38, highIntervention: 0.52 },
          { age: 25, control: 0.05, lowIntervention: 0.18, highIntervention: 0.30 },
          { age: 30, control: 0.0, lowIntervention: 0.04, highIntervention: 0.12 },
        ]
      }
    },
    publications: [
      {
        journal: "Nature Aging",
        status: "publicado",
        submissionDate: "2024-12-15",
        publicationDate: "2025-02-10",
        title: "Rapamycin analogs extend lifespan in C. elegans through mTOR pathway modulation",
        title_pt: "Análogos de rapamicina estendem tempo de vida em C. elegans através da modulação da via mTOR",
        title_en: "Rapamycin analogs extend lifespan in C. elegans through mTOR pathway modulation",
        doi: "10.1038/s43587-025-00123-4",
        impactFactor: 15.2,
        authors: "Matt Kaemberlend, PhD; Fabiano Matheus, PhD; Pet Love; PetMoreTime; Dr. André Correia",
        journalType: "internacional",
        journalCategory: "biomédica"
      },
      {
        journal: "Cell Metabolism",
        status: "em revisão",
        submissionDate: "2025-01-20",
        title: "Metabolic pathways involved in mTOR-mediated longevity extension",
        title_pt: "Vias metabólicas envolvidas na extensão de longevidade mediada por mTOR",
        title_en: "Metabolic pathways involved in mTOR-mediated longevity extension",
        impactFactor: 29.4,
        authors: "Matt Kaemberlend, PhD; Fabiano Matheus, PhD; Dr. André Correia; Pet Love",
        journalType: "internacional",
        journalCategory: "biomédica"
      },
      {
        journal: "Journal of Veterinary Internal Medicine",
        status: "aceito",
        submissionDate: "2025-01-10",
        title: "mTOR pathway modulation in companion animal longevity research",
        title_pt: "Modulação da via mTOR na pesquisa de longevidade de animais de companhia",
        title_en: "mTOR pathway modulation in companion animal longevity research",
        impactFactor: 2.8,
        authors: "Pet Love; PetMoreTime; Matt Kaemberlend, PhD; Fabiano Matheus, PhD",
        journalType: "internacional",
        journalCategory: "veterinária"
      },
      {
        journal: "Arquivo Brasileiro de Medicina Veterinária e Zootecnia",
        journal_pt: "Arquivo Brasileiro de Medicina Veterinária e Zootecnia",
        journal_en: "Brazilian Archives of Veterinary Medicine and Animal Science",
        status: "não submetido",
        title: "Aplicações veterinárias de inibidores de mTOR na longevidade animal",
        title_pt: "Aplicações veterinárias de inibidores de mTOR na longevidade animal",
        title_en: "Veterinary applications of mTOR inhibitors in animal longevity",
        impactFactor: 0.8,
        authors: "PetMoreTime; Pet Love; Fabiano Matheus, PhD; Matt Kaemberlend, PhD",
        journalType: "nacional",
        journalCategory: "veterinária"
      },
      {
        journal: "Veterinary Research",
        status: "submetido",
        submissionDate: "2025-02-01",
        title: "Translational research on mTOR inhibitors from C. elegans to veterinary applications",
        title_pt: "Pesquisa translacional sobre inibidores de mTOR de C. elegans para aplicações veterinárias",
        title_en: "Translational research on mTOR inhibitors from C. elegans to veterinary applications",
        impactFactor: 4.2,
        authors: "Matt Kaemberlend, PhD; Pet Love; PetMoreTime; Fabiano Matheus, PhD",
        journalType: "internacional",
        journalCategory: "veterinária"
      }
    ],
    hypotheses: {
      primary_pt: "A modulação da via mTOR através de análogos de rapamicina resultará em extensão significativa do tempo de vida em C. elegans, com efeitos dose-dependentes e janela terapêutica ótima quando iniciado na fase de adulto jovem.",
      primary_en: "mTOR pathway modulation through rapamycin analogs will result in significant lifespan extension in C. elegans, with dose-dependent effects and optimal therapeutic window when initiated in the young adult phase.",
      secondary_pt: [
        "Os efeitos de extensão de vida serão mais pronunciados em intervenções iniciadas precocemente",
        "A modulação de mTOR resultará em melhora da resposta ao estresse oxidativo",
        "Haverá trade-off entre taxa de reprodução e longevidade",
        "A extensão de vida será acompanhada por melhora nos marcadores de healthspan",
        "Os efeitos serão mediados por vias conservadas evolutivamente",
        "A combinação com restrição calórica potencializará os efeitos"
      ],
      secondary_en: [
        "Lifespan extension effects will be more pronounced in early-initiated interventions",
        "mTOR modulation will result in improved oxidative stress response",
        "There will be a trade-off between reproduction rate and longevity",
        "Lifespan extension will be accompanied by improved healthspan markers",
        "Effects will be mediated by evolutionarily conserved pathways",
        "Combination with caloric restriction will potentiate the effects"
      ]
    },
    previousStudies: [
      {
        id: "prev-1",
        title_pt: "Efeitos da rapamicina em leveduras (2006)",
        title_en: "Rapamycin effects in yeast (2006)",
        description_pt: "Estudo pioneiro demonstrando extensão de vida em Saccharomyces cerevisiae",
        description_en: "Pioneering study demonstrating lifespan extension in Saccharomyces cerevisiae",
        results_pt: "Extensão de 20% na longevidade replicativa",
        results_en: "20% extension in replicative longevity"
      },
      {
        id: "prev-2",
        title_pt: "Rapamicina em Drosophila (2009)",
        title_en: "Rapamycin in Drosophila (2009)",
        description_pt: "Investigação dos efeitos de mTOR em moscas da fruta",
        description_en: "Investigation of mTOR effects in fruit flies",
        results_pt: "Extensão significativa dependente de sexo e idade",
        results_en: "Significant sex- and age-dependent extension"
      },
      {
        id: "prev-3",
        title_pt: "Via mTOR em C. elegans selvagem (2015)",
        title_en: "mTOR pathway in wild-type C. elegans (2015)",
        description_pt: "Caracterização detalhada da via mTOR em vermes não-mutantes",
        description_en: "Detailed characterization of mTOR pathway in non-mutant worms",
        results_pt: "Identificação de pontos de controle críticos para longevidade",
        results_en: "Identification of critical control points for longevity"
      }
    ]
  },
  {
    id: "ora-c2",
    title: "Compostos quelantes e acúmulo de metais pesados",
    title_pt: "Compostos quelantes e acúmulo de metais pesados",
    title_en: "Chelating compounds and heavy metal accumulation",
    description: "Análise de agentes quelantes na redução do acúmulo de metais e impacto na longevidade",
    description_pt: "Análise de agentes quelantes na redução do acúmulo de metais e impacto na longevidade",
    description_en: "Analysis of chelating agents in reducing metal accumulation and impact on longevity",
    startDate: "2024-07-20",
    endDate: "2024-12-10",
    progress: 100,
    compounds: 18,
    positiveResults: 4,
    status: 'completed',
    primaryInvestigator: "Dra. Paula Vieira",
    priority: 'low',
    studyPopulation: 150,
    duration: "28 dias",
    duration_pt: "28 dias",
    duration_en: "28 days",
    category: 'metabólico',
    quantitativeResults: {
      lifeExtension: "+18.2%",
      lifeExtension_pt: "+18.2% no grupo tratamento",
      lifeExtension_en: "+18.2% in treatment group",
      pValue: "< 0.05",
      statisticalPower: "88%",
      effect: "Redução significativa de metais pesados e extensão moderada de vida",
      effect_pt: "Redução significativa de metais pesados e extensão moderada de vida",
      effect_en: "Significant reduction in heavy metals and moderate life extension"
    },
    publications: [
      {
        journal: "Free Radical Biology and Medicine",
        status: "aceito",
        submissionDate: "2024-11-30",
        title: "Metal chelation therapy extends lifespan by reducing oxidative damage",
        title_pt: "Terapia quelante de metais estende tempo de vida reduzindo dano oxidativo",
        title_en: "Metal chelation therapy extends lifespan by reducing oxidative damage",
        impactFactor: 8.3,
        authors: "Dra. Paula Vieira; Matt Kaemberlend, PhD; Fabiano Matheus, PhD; Pet Love",
        journalType: "internacional",
        journalCategory: "biomédica"
      },
      {
        journal: "Antioxidants & Redox Signaling",
        status: "submetido",
        submissionDate: "2025-01-05",
        title: "Mechanisms of metal detoxification in aging C. elegans",
        title_pt: "Mecanismos de detoxificação de metais em C. elegans em envelhecimento",
        title_en: "Mechanisms of metal detoxification in aging C. elegans",
        impactFactor: 6.5,
        authors: "Matt Kaemberlend, PhD; Dra. Paula Vieira; Fabiano Matheus, PhD; PetMoreTime",
        journalType: "internacional",
        journalCategory: "biomédica"
      },
      {
        journal: "Pesquisa Veterinária Brasileira",
        journal_pt: "Pesquisa Veterinária Brasileira",
        journal_en: "Brazilian Veterinary Research",
        status: "negado",
        submissionDate: "2024-12-15",
        title: "Terapia quelante para metais pesados em medicina veterinária",
        title_pt: "Terapia quelante para metais pesados em medicina veterinária",
        title_en: "Chelation therapy for heavy metals in veterinary medicine",
        impactFactor: 0.6,
        authors: "Pet Love; PetMoreTime; Dra. Paula Vieira; Fabiano Matheus, PhD",
        journalType: "nacional",
        journalCategory: "veterinária"
      },
      {
        journal: "Journal of Small Animal Practice",
        status: "não submetido",
        title: "Clinical applications of metal chelation in companion animals",
        title_pt: "Aplicações clínicas de quelação de metais em animais de companhia",
        title_en: "Clinical applications of metal chelation in companion animals",
        impactFactor: 1.4,
        authors: "PetMoreTime; Pet Love; Matt Kaemberlend, PhD; Dra. Paula Vieira",
        journalType: "internacional",
        journalCategory: "veterinária"
      }
    ],
    hypotheses: {
      primary_pt: "Compostos quelantes específicos para metais pesados reduzirão significativamente a toxicidade e o acúmulo desses metais em C. elegans, resultando em extensão do tempo de vida e melhora dos marcadores de saúde.",
      primary_en: "Specific chelating compounds for heavy metals will significantly reduce toxicity and accumulation of these metals in C. elegans, resulting in lifespan extension and improved health markers.",
      secondary_pt: [
        "A redução de metais pesados melhorará a função mitocondrial",
        "O tratamento quelante reduzirá marcadores de estresse oxidativo",
        "Diferentes quelantes terão eficácia variável dependendo do metal alvo",
        "A intervenção será mais eficaz quando iniciada antes do acúmulo crítico de metais"
      ],
      secondary_en: [
        "Heavy metal reduction will improve mitochondrial function",
        "Chelation therapy will reduce oxidative stress markers",
        "Different chelators will have variable efficacy depending on target metal",
        "Intervention will be more effective when initiated before critical metal accumulation"
      ]
    },
    previousStudies: [
      {
        id: "prev-4",
        title_pt: "Toxicidade de metais pesados em nematódeos (2018)",
        title_en: "Heavy metal toxicity in nematodes (2018)",
        description_pt: "Caracterização dos efeitos tóxicos de cádmio e chumbo em C. elegans",
        description_en: "Characterization of toxic effects of cadmium and lead in C. elegans",
        results_pt: "Acúmulo dose-dependente e redução de longevidade de até 40%",
        results_en: "Dose-dependent accumulation and longevity reduction of up to 40%"
      },
      {
        id: "prev-5",
        title_pt: "Agentes quelantes em modelos celulares (2020)",
        title_en: "Chelating agents in cellular models (2020)",
        description_pt: "Teste de diversos quelantes em culturas celulares expostas a metais",
        description_en: "Testing of various chelators in cell cultures exposed to metals",
        results_pt: "Identificação de candidatos promissores com baixa toxicidade",
        results_en: "Identification of promising candidates with low toxicity"
      }
    ]
  },
  {
    id: "ora-c3",
    title: "Extratos vegetais em resistência a radiação UV",
    title_pt: "Extratos vegetais em resistência a radiação UV",
    title_en: "Plant extracts in UV radiation resistance",
    description: "Screening de extratos botânicos e seus efeitos protetores contra danos por radiação ultravioleta",
    description_pt: "Screening de extratos botânicos e seus efeitos protetores contra danos por radiação ultravioleta",
    description_en: "Screening of botanical extracts and their protective effects against ultraviolet radiation damage",
    startDate: "2024-10-12",
    endDate: "2025-02-28",
    progress: 100,
    compounds: 42,
    positiveResults: 9,
    status: 'completed',
    primaryInvestigator: "Dra. Marina Souza",
    priority: 'high',
    studyPopulation: 200,
    duration: "14 dias",
    duration_pt: "14 dias",
    duration_en: "14 days",
    category: 'neuroprotetor',
    quantitativeResults: {
      lifeExtension: "+12.7%",
      lifeExtension_pt: "+12.7% no grupo tratamento",
      lifeExtension_en: "+12.7% in treatment group",
      pValue: "< 0.01",
      statisticalPower: "92%",
      effect: "Proteção significativa contra danos UV e moderada extensão de vida",
      effect_pt: "Proteção significativa contra danos UV e moderada extensão de vida",
      effect_en: "Significant protection against UV damage and moderate life extension"
    },
    publications: [
      {
        journal: "Journal of Gerontology: Biological Sciences",
        status: "publicado",
        submissionDate: "2024-12-20",
        publicationDate: "2025-03-01",
        title: "Plant extracts provide UV protection and extend lifespan in C. elegans",
        title_pt: "Extratos vegetais oferecem proteção UV e estendem tempo de vida em C. elegans",
        title_en: "Plant extracts provide UV protection and extend lifespan in C. elegans",
        doi: "10.1093/gerona/glab456",
        impactFactor: 4.8,
        authors: "Dra. Marina Souza; Matt Kaemberlend, PhD; Fabiano Matheus, PhD; Pet Love; PetMoreTime",
        journalType: "internacional",
        journalCategory: "biomédica"
      },
      {
        journal: "Mechanisms of Ageing and Development",
        status: "negado",
        submissionDate: "2024-11-15",
        title: "UV-protective compounds from botanical sources",
        title_pt: "Compostos fotoprotetores de fontes botânicas",
        title_en: "UV-protective compounds from botanical sources",
        impactFactor: 3.2,
        authors: "Matt Kaemberlend, PhD; Dra. Marina Souza; Fabiano Matheus, PhD; Pet Love",
        journalType: "internacional",
        journalCategory: "biomédica"
      },
      {
        journal: "GeroScience",
        status: "não submetido",
        title: "Comparative analysis of botanical UV protectants in aging models",
        title_pt: "Análise comparativa de fotoprotetores botânicos em modelos de envelhecimento",
        title_en: "Comparative analysis of botanical UV protectants in aging models",
        impactFactor: 5.1,
        authors: "Dra. Marina Souza; Fabiano Matheus, PhD; Matt Kaemberlend, PhD; PetMoreTime",
        journalType: "internacional",
        journalCategory: "biomédica"
      },
      {
        journal: "Brazilian Journal of Veterinary Research and Animal Science",
        journal_pt: "Revista Brasileira de Pesquisa Veterinária e Ciência Animal",
        journal_en: "Brazilian Journal of Veterinary Research and Animal Science",
        status: "em revisão",
        submissionDate: "2025-01-15",
        title: "Extratos vegetais como fotoprotetores em medicina veterinária",
        title_pt: "Extratos vegetais como fotoprotetores em medicina veterinária",
        title_en: "Plant extracts as photoprotectors in veterinary medicine",
        impactFactor: 0.7,
        authors: "Pet Love; PetMoreTime; Dra. Marina Souza; Fabiano Matheus, PhD",
        journalType: "nacional",
        journalCategory: "veterinária"
      },
      {
        journal: "Veterinary Therapeutics",
        status: "não submetido",
        title: "UV protection strategies using botanical compounds in companion animals",
        title_pt: "Estratégias de proteção UV usando compostos botânicos em animais de companhia",
        title_en: "UV protection strategies using botanical compounds in companion animals",
        impactFactor: 1.8,
        authors: "PetMoreTime; Pet Love; Matt Kaemberlend, PhD; Dra. Marina Souza",
        journalType: "internacional",
        journalCategory: "veterinária"
      },
      {
        journal: "Ciência Rural",
        journal_pt: "Ciência Rural",
        journal_en: "Rural Science",
        status: "aceito",
        submissionDate: "2024-12-10",
        title: "Fotoproteção natural em animais: uma revisão dos compostos botânicos",
        title_pt: "Fotoproteção natural em animais: uma revisão dos compostos botânicos",
        title_en: "Natural photoprotection in animals: a review of botanical compounds",
        impactFactor: 0.5,
        authors: "Fabiano Matheus, PhD; Pet Love; PetMoreTime; Dra. Marina Souza",
        journalType: "nacional",
        journalCategory: "veterinária"
      },
      {
        journal: "Preventive Veterinary Medicine",
        status: "submetido",
        submissionDate: "2025-02-05",
        title: "Prevention of UV-induced skin damage in companion animals using plant extracts",
        title_pt: "Prevenção de danos cutâneos induzidos por UV em animais de companhia usando extratos vegetais",
        title_en: "Prevention of UV-induced skin damage in companion animals using plant extracts",
        impactFactor: 2.9,
        authors: "Matt Kaemberlend, PhD; Pet Love; Dra. Marina Souza; PetMoreTime; Fabiano Matheus, PhD",
        journalType: "internacional",
        journalCategory: "veterinária"
      }
    ],
    hypotheses: {
      primary_pt: "Extratos vegetais ricos em compostos fenólicos e flavonoides proporcionarão proteção significativa contra danos causados por radiação UV em C. elegans, resultando em redução de mortalidade e extensão do tempo de vida.",
      primary_en: "Plant extracts rich in phenolic compounds and flavonoids will provide significant protection against UV radiation damage in C. elegans, resulting in reduced mortality and lifespan extension.",
      secondary_pt: [
        "A proteção UV será mediada por mecanismos antioxidantes diretos",
        "Diferentes extratos vegetais terão eficácia variável baseada em composição química",
        "A fotoproteção preservará a função mitocondrial",
        "O tratamento preventivo será mais eficaz que o tratamento após exposição UV",
        "Os efeitos protetores serão dose-dependentes",
        "Sinergias entre diferentes compostos vegetais potencializarão a proteção"
      ],
      secondary_en: [
        "UV protection will be mediated by direct antioxidant mechanisms",
        "Different plant extracts will have variable efficacy based on chemical composition",
        "Photoprotection will preserve mitochondrial function",
        "Preventive treatment will be more effective than post-UV exposure treatment",
        "Protective effects will be dose-dependent",
        "Synergies between different plant compounds will potentiate protection"
      ]
    },
    previousStudies: [
      {
        id: "prev-6",
        title_pt: "Danos UV em C. elegans (2017)",
        title_en: "UV damage in C. elegans (2017)",
        description_pt: "Caracterização dos efeitos deletérios da radiação UV em nematódeos",
        description_en: "Characterization of deleterious effects of UV radiation in nematodes",
        results_pt: "Redução de 35% na longevidade e aumento de marcadores de estresse",
        results_en: "35% reduction in longevity and increased stress markers"
      },
      {
        id: "prev-7",
        title_pt: "Flavonoides como fotoprotetores (2019)",
        title_en: "Flavonoids as photoprotectors (2019)",
        description_pt: "Avaliação de flavonoides purificados contra danos UV em culturas celulares",
        description_en: "Evaluation of purified flavonoids against UV damage in cell cultures",
        results_pt: "Redução significativa de danos ao DNA e apoptose",
        results_en: "Significant reduction in DNA damage and apoptosis"
      },
      {
        id: "prev-8",
        title_pt: "Extratos vegetais em modelos de pele (2021)",
        title_en: "Plant extracts in skin models (2021)",
        description_pt: "Teste de extratos botânicos em modelos de pele artificial exposta a UV",
        description_en: "Testing of botanical extracts in artificial skin models exposed to UV",
        results_pt: "Proteção eficaz com extratos de chá verde e romã",
        results_en: "Effective protection with green tea and pomegranate extracts"
      }
    ]
  }
];

export const plannedStudies: Study[] = [
  {
    id: "ora-p1",
    title: "Moduladores da autofagia em modelos de neurodegeneração",
    description: "Investigação de compostos que estimulam a autofagia em modelos de C. elegans para Alzheimer",
    startDate: "2025-05-10",
    progress: 0,
    compounds: 35,
    status: 'planned',
    primaryInvestigator: "Dr. Lucas Martins",
    priority: 'high'
  },
  {
    id: "ora-p2",
    title: "Isoflavonas e metabolismo lipídico",
    description: "Avaliação de isoflavonas derivadas de soja na modulação do metabolismo lipídico e longevidade",
    startDate: "2025-06-01",
    progress: 0,
    compounds: 24,
    status: 'planned',
    primaryInvestigator: "Dra. Júlia Campos",
    priority: 'medium'
  },
  {
    id: "ora-p3",
    title: "Alcaloides naturais e sinalização DAF-16/FOXO",
    description: "Análise de alcaloides vegetais na modulação de vias de sinalização relacionadas à longevidade",
    startDate: "2025-05-15",
    progress: 0,
    compounds: 30,
    status: 'planned',
    primaryInvestigator: "Dr. Mateus Costa",
    priority: 'low'
  }
];
