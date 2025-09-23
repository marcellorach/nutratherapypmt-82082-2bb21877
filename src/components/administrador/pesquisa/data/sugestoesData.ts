
import { UserCheck, Users, ShieldCheck, Briefcase } from "lucide-react";
import { ApprovalStage, Sugestao } from "../types/sugestoes";

// Definição dos estágios da cadeia de aprovação
export const approvalStages: ApprovalStage[] = [
  { id: 'scientific_supervision', name: 'Supervisão Científica', icon: UserCheck, color: 'blue' },
  { id: 'scientific_committee', name: 'Comitê Científico', icon: Users, color: 'indigo' },
  { id: 'ethics_committee', name: 'Comitê Ético', icon: ShieldCheck, color: 'violet' },
  { id: 'direction', name: 'Direção', icon: Briefcase, color: 'green' }
];

// Função para obter nomes traduzidos
export const getApprovalStageTranslatedName = (stageId: string, t: any) => {
  switch (stageId) {
    case 'scientific_supervision':
      return t('research.suggestions.approvalStages.scientificSupervision');
    case 'scientific_committee':
      return t('research.suggestions.approvalStages.scientificCommittee');
    case 'ethics_committee':
      return t('research.suggestions.approvalStages.ethicsCommittee');
    case 'direction':
      return t('research.suggestions.approvalStages.direction');
    default:
      return stageId;
  }
};

// Mock data para sugestões de pesquisa da IA
export const mockSugestoes: Sugestao[] = [
  {
    id: "1",
    titulo: "Efeito do resveratrol em longevidade canina",
    confianca: 87,
    baseado_em: [
      "Estudos recentes em humanos e roedores",
      "Análise de metabolismo oxidativo em diversas raças caninas",
      "Tendências nos dados de expectativa de vida na plataforma"
    ],
    populacao_sugerida: "Cães de raças médias a grandes, idade 5-8 anos",
    metodologia: "Estudo longitudinal de 24 meses com duas dosagens (50mg/dia e 100mg/dia) vs placebo",
    marcadores_sugeridos: [
      "Estresse oxidativo (níveis de isoprostano)",
      "Função mitocondrial",
      "Marcadores inflamatórios (IL-6, TNF-alpha)"
    ],
    raciocinio: "A análise longitudinal dos dados de saúde canina na plataforma revelou correlação significativa entre marcadores de estresse oxidativo elevados e o desenvolvimento de condições relacionadas à idade em cães de médio e grande porte. Em estudos de pesquisa recente em roedores, o resveratrol demonstrou capacidade de modular mecanismos similares aos observados em processos de envelhecimento canino.",
    status: "nova",
    approvalChain: [],
    origem: "ia"
  },
  {
    id: "2",
    titulo: "Colágeno tipo II não-desnaturado para displasia em cães jovens",
    confianca: 83,
    baseado_em: [
      "Meta-análise de resultados de colágeno em pacientes",
      "Dados longitudinais de cães com predisposição genética à displasia",
      "Estudos de biomarcadores de degradação cartilaginosa"
    ],
    populacao_sugerida: "Cães de 10-24 meses com predisposição genética a displasia",
    metodologia: "Estudo randomizado duplo-cego com 40mg/kg/dia vs placebo por 12 meses",
    marcadores_sugeridos: [
      "Biomarcadores de degradação de colágeno (CTX-II)",
      "Proteoglicanos urinários",
      "Avaliação radiográfica a cada 3 meses"
    ],
    raciocinio: "A análise de padrões nos dados clínicos da plataforma identificou que intervenções preventivas entre 10-24 meses de idade em raças predispostas à displasia demonstram maior eficácia que intervenções em fases tardias. O colágeno tipo II não-desnaturado tem demonstrado capacidade de modular respostas imunológicas associadas à degradação da cartilagem em estudos preliminares.",
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
    titulo: "Prebióticos específicos para microbioma em cães geriátricos",
    confianca: 79,
    baseado_em: [
      "Análise de diversidade do microbioma em diferentes faixas etárias",
      "Correlação entre microbioma e marcadores inflamatórios",
      "Estudos recentes sobre eixo intestino-cérebro em cães idosos"
    ],
    populacao_sugerida: "Cães acima de 9 anos, diversas raças",
    metodologia: "Intervenção com fórmula personalizada de FOS, GOS e XOS por 6 meses",
    marcadores_sugeridos: [
      "Análise de diversidade microbioma por sequenciamento",
      "Marcadores inflamatórios séricos",
      "Indicadores cognitivos padronizados"
    ],
    raciocinio: "A análise dos perfis de microbioma na plataforma demonstrou declínio progressivo da diversidade microbiana em cães acima de 9 anos, com correlação positiva com marcadores inflamatórios e alterações comportamentais. Estudos recentes sugerem que a modulação específica do microbioma com combinações prebióticas pode reverter parcialmente estas alterações.",
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
    titulo: "Protocolo alternado de inibidores SGLT2 (dapagliflozina/empagliflozina) para proteção cardiovascular e renal em cães não-diabéticos",
    confianca: 92,
    baseado_em: [
      "Análise epidemiológica longitudinal de 18.347 cães na plataforma (jan/2023 - dez/2024)",
      "Meta-análise de estudos DECLARE-TIMI 58 e DAPA-CKD traduzidos para modelos caninos",
      "Algoritmos de machine learning identificaram padrões de dessensibilização em uso contínuo",
      "Modelagem farmacocinética comparativa dapagliflozina vs empagliflozina em caninos"
    ],
    populacao_sugerida: "Cães não-diabéticos de 4-10 anos com fatores de risco cardiovascular ou renal",
    metodologia: "Estudo randomizado triplo-cego com protocolo alternado: dapagliflozina 0,1mg/kg/dia (12 dias) → empagliflozina 0,08mg/kg/dia (12 dias) → descanso (6 dias), em ciclos mensais por 18 meses vs placebo",
    marcadores_sugeridos: [
      "Biomarcadores cardíacos (NT-proBNP, troponina I)",
      "Função renal (creatinina, SDMA, proteinúria)",
      "Mortalidade por todas as causas",
      "Eventos cardiovasculares maiores (MACE)",
      "Marcadores de sensibilidade aos inibidores SGLT2"
    ],
    raciocinio: "A análise epidemiológica longitudinal na plataforma identificou que cães não-diabéticos tratados com dapagliflozina identificou redução significativa em eventos cardiovasculares e preservação da função renal. Entretanto, algoritmos de IA detectaram possível dessensibilização após 8-10 meses de uso contínuo. O protocolo alternado com empagliflozina (mecanismo SGLT2 ligeiramente diferente) pode prevenir dessensibilização mantendo eficácia cardioprotetiva e nefroprotetiva.",
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
      periodo_analise: "Janeiro 2023 - Dezembro 2024",
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
            predisposicao: "Doença degenerativa da válvula mitral"
          },
          {
            raca: "Dobermann",
            voluntarios: 35,
            predisposicao: "Cardiomiopatia dilatada"
          },
          {
            raca: "Golden Retriever",
            voluntarios: 40,
            predisposicao: "Cardiomiopatia e estenose subaórtica"
          },
          {
            raca: "Boxer",
            voluntarios: 38,
            predisposicao: "Cardiomiopatia arritmogênica"
          },
          {
            raca: "Pastor Alemão",
            voluntarios: 42,
            predisposicao: "Cardiomiopatia dilatada e estenose aórtica"
          }
        ]
      },
      cronograma_exames: {
        pre_estudo: [
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
        durante_estudo: [
          "Glicemia (mensal)",
          "Creatinina e SDMA (trimestral)",
          "NT-proBNP (trimestral)",
          "Pressão arterial (mensal)",
          "Urinálise básica (trimestral)"
        ],
        pos_estudo: [
          "Ultrassom cardíaco completo",
          "Ultrassom abdominal",
          "Hemograma completo",
          "Bioquímica sérica completa",
          "Urinálise completa",
          "Avaliação clínica detalhada"
        ],
        acompanhamento: [
          "Consulta clínica anual",
          "Hemograma básico",
          "Bioquímica básica",
          "Avaliação cardíaca (a cada 2 anos)"
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
