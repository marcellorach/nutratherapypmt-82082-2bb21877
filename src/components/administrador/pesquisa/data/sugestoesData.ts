
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
    approvalChain: []
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
    ]
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
    ]
  }
];
