import { OngoingStudy } from '../types/studyTypes';

export const ongoingStudiesData: OngoingStudy[] = [
  {
    id: "dog-study-1",
    title_pt: "Eficácia de Omega-3 em Mobilidade Articular Canina",
    title_en: "Efficacy of Omega-3 in Canine Joint Mobility",
    description_pt: "Avaliação do impacto da suplementação de Omega-3 em cães com problemas articulares leves a moderados",
    description_en: "Evaluation of the impact of Omega-3 supplementation in dogs with mild to moderate joint problems",
    objective_pt: "Determinar se a suplementação diária com Omega-3 melhora significativamente a mobilidade e reduz desconforto em cães com sinais iniciais de osteoartrite",
    objective_en: "Determine if daily Omega-3 supplementation significantly improves mobility and reduces discomfort in dogs with early signs of osteoarthritis",
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
    ageRange_pt: "5-10 anos",
    ageRange_en: "5-10 years",
    interventionType_pt: "Suplementação diária com cápsulas de Omega-3 (2000mg)",
    interventionType_en: "Daily supplementation with Omega-3 capsules (2000mg)",
    notes_pt: "Resultados preliminares mostram melhora significativa nas métricas de mobilidade do grupo de tratamento após 30 dias",
    notes_en: "Preliminary results show significant improvement in mobility metrics of the treatment group after 30 days",
    metrics: [
      {
        title_pt: "Índice de Mobilidade",
        title_en: "Mobility Index",
        description_pt: "Medida composta de flexibilidade articular e facilidade de movimento (0-10)",
        description_en: "Composite measure of joint flexibility and ease of movement (0-10)",
        data: [
          { label: "Semana 0", label_pt: "Semana 0", label_en: "Week 0", control: 4.2, treatment: 4.3 },
          { label: "Semana 2", label_pt: "Semana 2", label_en: "Week 2", control: 4.3, treatment: 5.1 },
          { label: "Semana 4", label_pt: "Semana 4", label_en: "Week 4", control: 4.4, treatment: 5.8 },
          { label: "Semana 6", label_pt: "Semana 6", label_en: "Week 6", control: 4.5, treatment: 6.3 }
        ],
        yAxisLabel_pt: "Índice (0-10)",
        yAxisLabel_en: "Index (0-10)",
        chartType: "line"
      },
      {
        title_pt: "Tempo de Deslocamento",
        title_en: "Displacement Time",
        description_pt: "Tempo médio para percorrer 15 metros em segundos",
        description_en: "Average time to cover 15 meters in seconds",
        data: [
          { label: "Semana 0", label_pt: "Semana 0", label_en: "Week 0", control: 12.5, treatment: 12.7 },
          { label: "Semana 2", label_pt: "Semana 2", label_en: "Week 2", control: 12.4, treatment: 11.8 },
          { label: "Semana 4", label_pt: "Semana 4", label_en: "Week 4", control: 12.3, treatment: 10.5 },
          { label: "Semana 6", label_pt: "Semana 6", label_en: "Week 6", control: 12.2, treatment: 9.7 }
        ],
        yAxisLabel_pt: "Segundos",
        yAxisLabel_en: "Seconds",
        chartType: "line"
      },
      {
        title_pt: "Resposta a Estímulo de Dor",
        title_en: "Response to Pain Stimulus",
        description_pt: "Escala de resposta a estímulo padronizado (0-5, menor é melhor)",
        description_en: "Standardized stimulus response scale (0-5, lower is better)",
        data: [
          { label: "Semana 0", label_pt: "Semana 0", label_en: "Week 0", control: 3.2, treatment: 3.3 },
          { label: "Semana 2", label_pt: "Semana 2", label_en: "Week 2", control: 3.1, treatment: 2.8 },
          { label: "Semana 4", label_pt: "Semana 4", label_en: "Week 4", control: 3.0, treatment: 2.3 },
          { label: "Semana 6", label_pt: "Semana 6", label_en: "Week 6", control: 3.1, treatment: 1.9 }
        ],
        yAxisLabel_pt: "Escala (0-5)",
        yAxisLabel_en: "Scale (0-5)",
        chartType: "bar"
      }
    ],
    phases: [
      { name_pt: "Início", name_en: "Start", day: 0 },
      { name_pt: "Avaliação 1", name_en: "Evaluation 1", day: 21 },
      { name_pt: "Avaliação 2", name_en: "Evaluation 2", day: 42 },
      { name_pt: "Final", name_en: "Final", day: 70 }
    ]
  },
  {
    id: "dog-study-2",
    title_pt: "Efeitos de Senolíticos + Moduladores mTOR na Prevenção do Declínio Cognitivo em Cães Idosos",
    title_en: "Effects of Senolytics + mTOR Modulators in Preventing Cognitive Decline in Elderly Dogs",
    description_pt: "Avaliação da eficácia combinada de senolíticos e moduladores mTOR na função cognitiva de cães sênior",
    description_en: "Evaluation of the combined efficacy of senolytics and mTOR modulators on cognitive function in senior dogs",
    objective_pt: "Determinar se a terapia combinada previne o declínio cognitivo e melhora biomarcadores de envelhecimento em cães idosos",
    objective_en: "Determine if combined therapy prevents cognitive decline and improves aging biomarkers in elderly dogs",
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
    ageRange_pt: "8+ anos",
    ageRange_en: "8+ years",
    interventionType_pt: "Suplementação diária com senolíticos + moduladores mTOR (rapamicina + quercetina + dasatinib)",
    interventionType_en: "Daily supplementation with senolytics + mTOR modulators (rapamycin + quercetin + dasatinib)",
    notes_pt: "Biomarcadores de senescência mostram redução significativa e função cognitiva apresenta melhoria no grupo de tratamento",
    notes_en: "Senescence biomarkers show significant reduction and cognitive function shows improvement in the treatment group",
    metrics: [
      {
        title_pt: "Índice de Função Cognitiva",
        title_en: "Cognitive Function Index",
        description_pt: "Teste composto de memória, aprendizado e função executiva (0-100)",
        description_en: "Composite test of memory, learning, and executive function (0-100)",
        data: [
          { label: "Semana 0", label_pt: "Semana 0", label_en: "Week 0", control: 67.2, treatment: 66.8 },
          { label: "Semana 2", label_pt: "Semana 2", label_en: "Week 2", control: 67.5, treatment: 72.3 },
          { label: "Semana 4", label_pt: "Semana 4", label_en: "Week 4", control: 67.1, treatment: 78.9 }
        ],
        yAxisLabel_pt: "Índice (0-100)",
        yAxisLabel_en: "Index (0-100)",
        chartType: "line"
      },
      {
        title_pt: "Biomarcadores p16 e p21",
        title_en: "Biomarkers p16 and p21",
        description_pt: "Expressão de marcadores de senescência celular (unidades relativas)",
        description_en: "Expression of cellular senescence markers (relative units)",
        data: [
          { label: "Semana 0", label_pt: "Semana 0", label_en: "Week 0", control: 100, treatment: 98 },
          { label: "Semana 2", label_pt: "Semana 2", label_en: "Week 2", control: 102, treatment: 85 },
          { label: "Semana 4", label_pt: "Semana 4", label_en: "Week 4", control: 105, treatment: 72 }
        ],
        yAxisLabel_pt: "Expressão Relativa",
        yAxisLabel_en: "Relative Expression",
        chartType: "bar"
      },
      {
        title_pt: "Atividade da Via mTOR",
        title_en: "mTOR Pathway Activity",
        description_pt: "Fosforilação S6K1 - indicador de modulação mTOR (unidades arbitrárias)",
        description_en: "S6K1 phosphorylation - indicator of mTOR modulation (arbitrary units)",
        data: [
          { label: "Semana 0", label_pt: "Semana 0", label_en: "Week 0", control: 1.45, treatment: 1.43 },
          { label: "Semana 2", label_pt: "Semana 2", label_en: "Week 2", control: 1.47, treatment: 1.12 },
          { label: "Semana 4", label_pt: "Semana 4", label_en: "Week 4", control: 1.46, treatment: 0.89 }
        ],
        yAxisLabel_pt: "Fosforilação S6K1",
        yAxisLabel_en: "S6K1 Phosphorylation",
        chartType: "line"
      }
    ],
    phases: [
      { name_pt: "Início", name_en: "Start", day: 0 },
      { name_pt: "Avaliação Cognitiva 1", name_en: "Cognitive Evaluation 1", day: 14 },
      { name_pt: "Biomarcadores 1", name_en: "Biomarkers 1", day: 28 },
      { name_pt: "Avaliação Cognitiva 2", name_en: "Cognitive Evaluation 2", day: 49 },
      { name_pt: "Final", name_en: "Final", day: 70 }
    ]
  }
];
