
import { OngoingStudy } from '../types/studyTypes';

export const ongoingStudiesData: OngoingStudy[] = [
  {
    id: "dog-study-1",
    title: "Eficácia de Omega-3 em Mobilidade Articular Canina",
    description: "Avaliação do impacto da suplementação de Omega-3 em cães com problemas articulares leves a moderados",
    objective: "Determinar se a suplementação diária com Omega-3 melhora significativamente a mobilidade e reduz desconforto em cães com sinais iniciais de osteoartrite",
    startDate: "2025-03-15",
    currentDay: 45,
    totalDays: 70,
    treatmentCount: 25,
    controlCount: 25,
    phase: "evaluation",
    status: "ongoing",
    progress: 65,
    primaryInvestigator: "Dra. Luiza Campos",
    breeds: ["Labrador", "Golden Retriever", "Pastor Alemão", "Raças mistas"],
    ageRange: "5-10 anos",
    interventionType: "Suplementação diária com cápsulas de Omega-3 (2000mg)",
    notes: "Resultados preliminares mostram melhora significativa nas métricas de mobilidade do grupo de tratamento após 30 dias",
    metrics: [
      {
        title: "Índice de Mobilidade",
        description: "Medida composta de flexibilidade articular e facilidade de movimento (0-10)",
        data: [
          { label: "Semana 0", control: 4.2, treatment: 4.3 },
          { label: "Semana 2", control: 4.3, treatment: 5.1 },
          { label: "Semana 4", control: 4.4, treatment: 5.8 },
          { label: "Semana 6", control: 4.5, treatment: 6.3 }
        ],
        yAxisLabel: "Índice (0-10)",
        chartType: "line"
      },
      {
        title: "Tempo de Deslocamento",
        description: "Tempo médio para percorrer 15 metros em segundos",
        data: [
          { label: "Semana 0", control: 12.5, treatment: 12.7 },
          { label: "Semana 2", control: 12.4, treatment: 11.8 },
          { label: "Semana 4", control: 12.3, treatment: 10.5 },
          { label: "Semana 6", control: 12.2, treatment: 9.7 }
        ],
        yAxisLabel: "Segundos",
        chartType: "line"
      },
      {
        title: "Resposta a Estímulo de Dor",
        description: "Escala de resposta a estímulo padronizado (0-5, menor é melhor)",
        data: [
          { label: "Semana 0", control: 3.2, treatment: 3.3 },
          { label: "Semana 2", control: 3.1, treatment: 2.8 },
          { label: "Semana 4", control: 3.0, treatment: 2.3 },
          { label: "Semana 6", control: 3.1, treatment: 1.9 }
        ],
        yAxisLabel: "Escala (0-5)",
        chartType: "bar"
      }
    ],
    phases: [
      { name: "Início", day: 0 },
      { name: "Avaliação 1", day: 21 },
      { name: "Avaliação 2", day: 42 },
      { name: "Final", day: 70 }
    ]
  },
  {
    id: "dog-study-2",
    title: "Efeitos de Senolíticos + Moduladores mTOR na Prevenção do Declínio Cognitivo em Cães Idosos",
    description: "Avaliação da eficácia combinada de senolíticos e moduladores mTOR na função cognitiva de cães sênior",
    objective: "Determinar se a terapia combinada previne o declínio cognitivo e melhora biomarcadores de envelhecimento em cães idosos",
    startDate: "2025-04-10",
    currentDay: 28,
    totalDays: 70,
    treatmentCount: 20,
    controlCount: 20,
    phase: "intervention",
    status: "ongoing",
    progress: 40,
    primaryInvestigator: "Dr. Carlos Mendes",
    breeds: ["Poodle", "Beagle", "Dachshund", "Raças mistas pequenas"],
    ageRange: "8+ anos",
    interventionType: "Suplementação diária com senolíticos + moduladores mTOR (rapamicina + quercetina + dasatinib)",
    notes: "Biomarcadores de senescência mostram redução significativa e função cognitiva apresenta melhoria no grupo de tratamento",
    metrics: [
      {
        title: "Índice de Função Cognitiva",
        description: "Teste composto de memória, aprendizado e função executiva (0-100)",
        data: [
          { label: "Semana 0", control: 67.2, treatment: 66.8 },
          { label: "Semana 2", control: 67.5, treatment: 72.3 },
          { label: "Semana 4", control: 67.1, treatment: 78.9 }
        ],
        yAxisLabel: "Índice (0-100)",
        chartType: "line"
      },
      {
        title: "Biomarcadores p16 e p21",
        description: "Expressão de marcadores de senescência celular (unidades relativas)",
        data: [
          { label: "Semana 0", control: 100, treatment: 98 },
          { label: "Semana 2", control: 102, treatment: 85 },
          { label: "Semana 4", control: 105, treatment: 72 }
        ],
        yAxisLabel: "Expressão Relativa",
        chartType: "bar"
      },
      {
        title: "Atividade da Via mTOR",
        description: "Fosforilação S6K1 - indicador de modulação mTOR (unidades arbitrárias)",
        data: [
          { label: "Semana 0", control: 1.45, treatment: 1.43 },
          { label: "Semana 2", control: 1.47, treatment: 1.12 },
          { label: "Semana 4", control: 1.46, treatment: 0.89 }
        ],
        yAxisLabel: "Fosforilação S6K1",
        chartType: "line"
      }
    ],
    phases: [
      { name: "Início", day: 0 },
      { name: "Avaliação Cognitiva 1", day: 14 },
      { name: "Biomarcadores 1", day: 28 },
      { name: "Avaliação Cognitiva 2", day: 49 },
      { name: "Final", day: 70 }
    ]
  }
];
