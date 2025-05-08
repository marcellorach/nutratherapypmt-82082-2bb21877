
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
    title: "Efeitos de Antioxidantes no Envelhecimento Cognitivo em Cães Sênior",
    description: "Avaliação da eficácia de uma mistura de antioxidantes na função cognitiva de cães idosos",
    objective: "Avaliar se a suplementação com uma combinação específica de antioxidantes melhora a função cognitiva e reduz sinais de declínio mental em cães sênior",
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
    interventionType: "Suplementação diária com composto de antioxidantes (vitamina E, selênio, flavonóides)",
    notes: "Testes cognitivos preliminares mostram tendência positiva no grupo de tratamento",
    metrics: [
      {
        title: "Tempo de Resolução de Problemas",
        description: "Tempo médio para completar tarefas de resolução de problemas (segundos)",
        data: [
          { label: "Semana 0", control: 45.3, treatment: 44.8 },
          { label: "Semana 2", control: 44.9, treatment: 40.2 },
          { label: "Semana 4", control: 44.5, treatment: 36.7 }
        ],
        yAxisLabel: "Segundos",
        chartType: "line"
      },
      {
        title: "Testes de Reconhecimento",
        description: "Taxa de sucesso em testes de reconhecimento de objetos (%)",
        data: [
          { label: "Semana 0", control: 62, treatment: 61 },
          { label: "Semana 2", control: 63, treatment: 68 },
          { label: "Semana 4", control: 64, treatment: 74 }
        ],
        yAxisLabel: "Sucesso (%)",
        chartType: "bar",
        formatter: "percent"
      },
      {
        title: "Atenção Sustentada",
        description: "Duração da atenção sustentada em tarefas padronizadas (segundos)",
        data: [
          { label: "Semana 0", control: 32.1, treatment: 31.8 },
          { label: "Semana 2", control: 32.5, treatment: 35.4 },
          { label: "Semana 4", control: 32.3, treatment: 38.9 }
        ],
        yAxisLabel: "Segundos",
        chartType: "line"
      }
    ],
    phases: [
      { name: "Início", day: 0 },
      { name: "Avaliação 1", day: 14 },
      { name: "Avaliação 2", day: 35 },
      { name: "Avaliação 3", day: 56 },
      { name: "Final", day: 70 }
    ]
  }
];
