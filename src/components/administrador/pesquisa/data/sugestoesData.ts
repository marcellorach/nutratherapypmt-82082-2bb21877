
import { UserCheck, Users, ShieldCheck, Briefcase } from "lucide-react";
import { ApprovalStage, Sugestao } from "../types/sugestoes";

// Definição dos estágios da cadeia de aprovação
export const approvalStages: ApprovalStage[] = [
  { id: 'scientific_supervision', name: 'Supervisão Científica', icon: UserCheck, color: 'blue' },
  { id: 'scientific_committee', name: 'Comitê Científico', icon: Users, color: 'indigo' },
  { id: 'ethics_committee', name: 'Comitê Ético', icon: ShieldCheck, color: 'violet' },
  { id: 'direction', name: 'Direção', icon: Briefcase, color: 'green' }
];

// Mock data para sugestões de pesquisa da IA
export const mockSugestoes: Sugestao[] = [
  {
    id: "1",
    titulo_pt: "Efeito do resveratrol em longevidade canina",
    titulo_en: "Effect of resveratrol on canine longevity",
    confianca: 87,
    baseado_em_pt: [
      "Estudos recentes em humanos e roedores",
      "Análise de metabolismo oxidativo em diversas raças caninas",
      "Tendências nos dados de expectativa de vida na plataforma"
    ],
    baseado_em_en: [
      "Recent studies in humans and rodents",
      "Analysis of oxidative metabolism in various canine breeds",
      "Trends in life expectancy data on the platform"
    ],
    populacao_sugerida_pt: "Cães de raças médias a grandes, idade 5-8 anos",
    populacao_sugerida_en: "Medium to large breed dogs, age 5-8 years",
    metodologia_pt: "Estudo longitudinal de 24 meses com duas dosagens (50mg/dia e 100mg/dia) vs placebo",
    metodologia_en: "24-month longitudinal study with two dosages (50mg/day and 100mg/day) vs placebo",
    marcadores_sugeridos_pt: [
      "Estresse oxidativo (níveis de isoprostano)",
      "Função mitocondrial",
      "Marcadores inflamatórios (IL-6, TNF-alpha)"
    ],
    marcadores_sugeridos_en: [
      "Oxidative stress (isoprostane levels)",
      "Mitochondrial function",
      "Inflammatory markers (IL-6, TNF-alpha)"
    ],
    raciocinio_pt: "A análise longitudinal dos dados de saúde canina na plataforma revelou correlação significativa entre marcadores de estresse oxidativo elevados e o desenvolvimento de condições relacionadas à idade em cães de médio e grande porte. Em estudos de pesquisa recente em roedores, o resveratrol demonstrou capacidade de modular mecanismos similares aos observados em processos de envelhecimento canino.",
    raciocinio_en: "Longitudinal analysis of canine health data on the platform revealed significant correlation between elevated oxidative stress markers and the development of age-related conditions in medium and large breed dogs. Recent research studies in rodents have shown resveratrol's ability to modulate mechanisms similar to those observed in canine aging processes.",
    status: "nova",
    approvalChain: [],
    origem: "ia"
  },
  {
    id: "2",
    titulo_pt: "Colágeno tipo II não-desnaturado para displasia em cães jovens",
    titulo_en: "Undenatured type II collagen for dysplasia in young dogs",
    confianca: 83,
    baseado_em_pt: [
      "Meta-análise de resultados de colágeno em pacientes",
      "Dados longitudinais de cães com predisposição genética à displasia",
      "Estudos de biomarcadores de degradação cartilaginosa"
    ],
    baseado_em_en: [
      "Meta-analysis of collagen results in patients",
      "Longitudinal data from dogs with genetic predisposition to dysplasia",
      "Studies on cartilage degradation biomarkers"
    ],
    populacao_sugerida_pt: "Cães de 10-24 meses com predisposição genética a displasia",
    populacao_sugerida_en: "Dogs aged 10-24 months with genetic predisposition to dysplasia",
    metodologia_pt: "Estudo randomizado duplo-cego com 40mg/kg/dia vs placebo por 12 meses",
    metodologia_en: "Double-blind randomized study with 40mg/kg/day vs placebo for 12 months",
    marcadores_sugeridos_pt: [
      "Biomarcadores de degradação de colágeno (CTX-II)",
      "Proteoglicanos urinários",
      "Avaliação radiográfica a cada 3 meses"
    ],
    marcadores_sugeridos_en: [
      "Collagen degradation biomarkers (CTX-II)",
      "Urinary proteoglycans",
      "Radiographic evaluation every 3 months"
    ],
    raciocinio_pt: "A análise de padrões nos dados clínicos da plataforma identificou que intervenções preventivas entre 10-24 meses de idade em raças predispostas à displasia demonstram maior eficácia que intervenções em fases tardias. O colágeno tipo II não-desnaturado tem demonstrado capacidade de modular respostas imunológicas associadas à degradação da cartilagem em estudos preliminares.",
    raciocinio_en: "Pattern analysis in the platform's clinical data identified that preventive interventions between 10-24 months of age in breeds predisposed to dysplasia demonstrate greater efficacy than late-stage interventions. Undenatured type II collagen has shown the ability to modulate immune responses associated with cartilage degradation in preliminary studies.",
    status: "aprovada",
    approvalChain: [
      { stage: 'scientific_supervision', approved: true, date: '15/03/2025' },
      { stage: 'scientific_committee', approved: true, date: '22/03/2025' },
      { stage: 'ethics_committee', approved: true, date: '28/03/2025' },
      { stage: 'direction', approved: true, date: '05/04/2025' },
    ],
    origem: "comite_cientifico"
  },
  {
    id: "3",
    titulo_pt: "Prebióticos específicos para microbioma em cães geriátricos",
    titulo_en: "Specific prebiotics for microbiome in geriatric dogs",
    confianca: 79,
    baseado_em_pt: [
      "Análise de diversidade do microbioma em diferentes faixas etárias",
      "Correlação entre microbioma e marcadores inflamatórios",
      "Estudos recentes sobre eixo intestino-cérebro em cães idosos"
    ],
    baseado_em_en: [
      "Microbiome diversity analysis across different age ranges",
      "Correlation between microbiome and inflammatory markers",
      "Recent studies on gut-brain axis in elderly dogs"
    ],
    populacao_sugerida_pt: "Cães acima de 9 anos, diversas raças",
    populacao_sugerida_en: "Dogs over 9 years old, various breeds",
    metodologia_pt: "Intervenção com fórmula personalizada de FOS, GOS e XOS por 6 meses",
    metodologia_en: "Intervention with personalized formula of FOS, GOS and XOS for 6 months",
    marcadores_sugeridos_pt: [
      "Análise de diversidade microbioma por sequenciamento",
      "Marcadores inflamatórios séricos",
      "Indicadores cognitivos padronizados"
    ],
    marcadores_sugeridos_en: [
      "Microbiome diversity analysis by sequencing",
      "Serum inflammatory markers",
      "Standardized cognitive indicators"
    ],
    raciocinio_pt: "A análise dos perfis de microbioma na plataforma demonstrou declínio progressivo da diversidade microbiana em cães acima de 9 anos, com correlação positiva com marcadores inflamatórios e alterações comportamentais. Estudos recentes sugerem que a modulação específica do microbioma com combinações prebióticas pode reverter parcialmente estas alterações.",
    raciocinio_en: "Analysis of microbiome profiles on the platform showed progressive decline in microbial diversity in dogs over 9 years old, with positive correlation to inflammatory markers and behavioral changes. Recent studies suggest that specific microbiome modulation with prebiotic combinations can partially reverse these alterations.",
    status: "em_analise",
    approvalChain: [
      { stage: 'scientific_supervision', approved: true, date: '02/04/2025' },
      { stage: 'scientific_committee', approved: null, date: null },
      { stage: 'ethics_committee', approved: null, date: null },
      { stage: 'direction', approved: null, date: null },
    ],
    origem: "externa"
  },
  {
    id: "4",
    titulo_pt: "Protocolo alternado de inibidores SGLT2 (dapagliflozina/empagliflozina) para proteção cardiovascular e renal em cães não-diabéticos",
    titulo_en: "Alternating SGLT2 inhibitors protocol (dapagliflozin/empagliflozin) for cardiovascular and renal protection in non-diabetic dogs",
    confianca: 92,
    baseado_em_pt: [
      "Análise epidemiológica longitudinal de 18.347 cães na plataforma (jan/2023 - dez/2024)",
      "Meta-análise de estudos DECLARE-TIMI 58 e DAPA-CKD traduzidos para modelos caninos",
      "Algoritmos de machine learning identificaram padrões de dessensibilização em uso contínuo",
      "Modelagem farmacocinética comparativa dapagliflozina vs empagliflozina em caninos"
    ],
    baseado_em_en: [
      "Longitudinal epidemiological analysis of 18,347 dogs on the platform (Jan/2023 - Dec/2024)",
      "Meta-analysis of DECLARE-TIMI 58 and DAPA-CKD studies translated to canine models",
      "Machine learning algorithms identified desensitization patterns in continuous use",
      "Comparative pharmacokinetic modeling of dapagliflozin vs empagliflozin in canines"
    ],
    populacao_sugerida_pt: "Cães não-diabéticos de 4-10 anos com fatores de risco cardiovascular ou renal",
    populacao_sugerida_en: "Non-diabetic dogs aged 4-10 years with cardiovascular or renal risk factors",
    metodologia_pt: "Estudo randomizado triplo-cego com protocolo alternado: dapagliflozina 0,1mg/kg/dia (12 dias) → empagliflozina 0,08mg/kg/dia (12 dias) → descanso (6 dias), em ciclos mensais por 18 meses vs placebo",
    metodologia_en: "Triple-blind randomized study with alternating protocol: dapagliflozin 0.1mg/kg/day (12 days) → empagliflozin 0.08mg/kg/day (12 days) → rest (6 days), in monthly cycles for 18 months vs placebo",
    marcadores_sugeridos_pt: [
      "Biomarcadores cardíacos (NT-proBNP, troponina I)",
      "Função renal (creatinina, SDMA, proteinúria)",
      "Mortalidade por todas as causas",
      "Eventos cardiovasculares maiores (MACE)",
      "Marcadores de sensibilidade aos inibidores SGLT2"
    ],
    marcadores_sugeridos_en: [
      "Cardiac biomarkers (NT-proBNP, troponin I)",
      "Renal function (creatinine, SDMA, proteinuria)",
      "All-cause mortality",
      "Major adverse cardiovascular events (MACE)",
      "SGLT2 inhibitor sensitivity markers"
    ],
    raciocinio_pt: "A análise epidemiológica longitudinal na plataforma identificou que cães não-diabéticos tratados com dapagliflozina identificou redução significativa em eventos cardiovasculares e preservação da função renal. Entretanto, algoritmos de IA detectaram possível dessensibilização após 8-10 meses de uso contínuo. O protocolo alternado com empagliflozina (mecanismo SGLT2 ligeiramente diferente) pode prevenir dessensibilização mantendo eficácia cardioprotetiva e nefroprotetiva.",
    raciocinio_en: "Longitudinal epidemiological analysis on the platform identified that non-diabetic dogs treated with dapagliflozin showed significant reduction in cardiovascular events and preservation of renal function. However, AI algorithms detected possible desensitization after 8-10 months of continuous use. The alternating protocol with empagliflozin (slightly different SGLT2 mechanism) may prevent desensitization while maintaining cardioprotective and nephroprotective efficacy.",
    status: "aprovada",
    approvalChain: [
      { stage: 'scientific_supervision', approved: true, date: '10/01/2025' },
      { stage: 'scientific_committee', approved: true, date: '18/01/2025' },
      { stage: 'ethics_committee', approved: true, date: '25/01/2025' },
      { stage: 'direction', approved: true, date: '02/02/2025' },
    ],
    origem: "ia",
    dados_amostra: {
      total_caes: 18347,
      usuarios_tratamento: 2156,
      grupo_controle: 16191,
      periodo_analise_pt: "Janeiro 2023 - Dezembro 2024",
      periodo_analise_en: "January 2023 - December 2024",
      resultados_observacionais: {
        reducao_eventos_cardiovasculares: "34% (IC95%: 28-41%, p<0.001)",
        melhora_funcao_renal: "28% redução na progressão da doença renal (p<0.001)",
        reducao_mortalidade: "22% redução em mortalidade por todas as causas (p=0.003)"
      }
    },
    recursos_necessarios: {
      populacao_estudo: {
        total_caes: 200,
        idade: "5-8 anos",
        grupo_placebo: 100,
        grupo_tratamento: 100,
        duracao_meses: 18,
        distribuicao_racas: {
          pequeno_porte: 25,
          medio_porte: 45,
          grande_porte: 30
        },
        racas_cardiacas: [
          {
            raca: "Cavalier King Charles Spaniel",
            voluntarios: 45,
            predisposicao_pt: "Doença degenerativa da válvula mitral",
            predisposicao_en: "Degenerative mitral valve disease"
          },
          {
            raca: "Dobermann",
            voluntarios: 35,
            predisposicao_pt: "Cardiomiopatia dilatada",
            predisposicao_en: "Dilated cardiomyopathy"
          },
          {
            raca: "Golden Retriever",
            voluntarios: 40,
            predisposicao_pt: "Cardiomiopatia e estenose subaórtica",
            predisposicao_en: "Cardiomyopathy and subaortic stenosis"
          },
          {
            raca: "Boxer",
            voluntarios: 38,
            predisposicao_pt: "Cardiomiopatia arritmogênica",
            predisposicao_en: "Arrhythmogenic cardiomyopathy"
          },
          {
            raca: "Pastor Alemão",
            voluntarios: 42,
            predisposicao_pt: "Cardiomiopatia dilatada e estenose aórtica",
            predisposicao_en: "Dilated cardiomyopathy and aortic stenosis"
          }
        ]
      },
      cronograma_exames: {
        pre_estudo_pt: [
          "Hemograma completo",
          "Bioquímica sérica (glicose, creatinina, ALT, AST)",
          "Ultrassom cardíaco (ecocardiograma)",
          "Ultrassom abdominal",
          "Eletrocardiograma",
          "Pressão arterial",
          "Urinálise completa",
          "SDMA",
          "NT-proBNP",
          "Troponina I"
        ],
        pre_estudo_en: [
          "Complete blood count",
          "Serum biochemistry (glucose, creatinine, ALT, AST)",
          "Cardiac ultrasound (echocardiogram)",
          "Abdominal ultrasound",
          "Electrocardiogram",
          "Blood pressure",
          "Complete urinalysis",
          "SDMA",
          "NT-proBNP",
          "Troponin I"
        ],
        durante_estudo_pt: [
          "Glicemia (mensal)",
          "Creatinina e SDMA (trimestral)",
          "NT-proBNP (trimestral)",
          "Pressão arterial (mensal)",
          "Urinálise básica (trimestral)"
        ],
        durante_estudo_en: [
          "Blood glucose (monthly)",
          "Creatinine and SDMA (quarterly)",
          "NT-proBNP (quarterly)",
          "Blood pressure (monthly)",
          "Basic urinalysis (quarterly)"
        ],
        pos_estudo_pt: [
          "Ultrassom cardíaco completo",
          "Ultrassom abdominal",
          "Hemograma completo",
          "Bioquímica sérica completa",
          "Urinálise completa",
          "Avaliação clínica detalhada"
        ],
        pos_estudo_en: [
          "Complete cardiac ultrasound",
          "Abdominal ultrasound",
          "Complete blood count",
          "Complete serum biochemistry",
          "Complete urinalysis",
          "Detailed clinical evaluation"
        ],
        acompanhamento_pt: [
          "Consulta clínica anual",
          "Hemograma básico",
          "Bioquímica básica",
          "Avaliação cardíaca (a cada 2 anos)"
        ],
        acompanhamento_en: [
          "Annual clinical visit",
          "Basic blood count",
          "Basic biochemistry",
          "Cardiac evaluation (every 2 years)"
        ]
      },
      custos_estimados: {
        exames_laboratoriais: 350000,
        ultrassons: 180000,
        medicamentos: 95000,
        pessoal: 420000,
        total: 1045000,
        custo_por_animal_mes: 290
      }
    }
  }
];
