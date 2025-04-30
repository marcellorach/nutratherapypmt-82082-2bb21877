
import { NtaiAnalysisResult } from '@/types/ntai';

export const scoreStudyQuality = (studyId: string): number => {
  // Algoritmo simulado para avaliação da qualidade do estudo
  return Number((3 + Math.random() * 2).toFixed(1)); // Entre 3.0 e 5.0
};

export const scoreStudyRelevance = (studyId: string): number => {
  // Algoritmo simulado para avaliação da relevância do estudo
  return Number((2.5 + Math.random() * 2.5).toFixed(1)); // Entre 2.5 e 5.0
};

export const extractNutraceuticalsFromStudy = (studyText: string): Array<{name: string, confidence: number}> => {
  // Simulando a extração de nutracêuticos de um texto
  const commonNutraceuticals = [
    'Glucosamina',
    'Condroitina',
    'Ômega 3',
    'Ômega 6',
    'MSM (Metilsulfonilmetano)',
    'Curcumina',
    'Resveratrol',
    'Probióticos',
    'Prebióticos',
    'Quitosana',
    'Vitamina E',
    'Coenzima Q10',
    'L-carnitina',
    'Taurina',
    'Extrato de Canabidiol',
    'SAMe'
  ];

  // Selecionar alguns nutracêuticos aleatoriamente
  const numToSelect = Math.floor(Math.random() * 5) + 1; // 1 a 5 nutracêuticos
  const selectedNutraceuticals: Array<{name: string, confidence: number}> = [];
  
  const shuffled = [...commonNutraceuticals].sort(() => 0.5 - Math.random());
  for (let i = 0; i < Math.min(numToSelect, shuffled.length); i++) {
    selectedNutraceuticals.push({
      name: shuffled[i],
      confidence: Number((0.7 + Math.random() * 0.3).toFixed(2)) // Entre 0.7 e 1.0
    });
  }
  
  return selectedNutraceuticals;
};

export const extractConditionsFromStudy = (studyText: string): Array<{name: string, confidence: number}> => {
  // Simulando a extração de condições de saúde de um texto
  const commonConditions = [
    'Artrite',
    'Osteoartrite',
    'Displasia',
    'Obesidade',
    'Diabetes',
    'Problemas Cardíacos',
    'Doença Renal Crônica',
    'Alergias Alimentares',
    'Dermatite Atópica',
    'Doença Periodontal',
    'Ansiedade',
    'Problemas Digestivos',
    'Inflamação Intestinal',
    'Hipotireoidismo',
    'Hipertensão',
    'Câncer'
  ];

  // Selecionar algumas condições aleatoriamente
  const numToSelect = Math.floor(Math.random() * 4) + 1; // 1 a 4 condições
  const selectedConditions: Array<{name: string, confidence: number}> = [];
  
  const shuffled = [...commonConditions].sort(() => 0.5 - Math.random());
  for (let i = 0; i < Math.min(numToSelect, shuffled.length); i++) {
    selectedConditions.push({
      name: shuffled[i],
      confidence: Number((0.65 + Math.random() * 0.35).toFixed(2)) // Entre 0.65 e 1.0
    });
  }
  
  return selectedConditions;
};

export const extractInteractionsFromStudy = (studyText: string): Array<{nutraceutical: string, interaction: string, confidence: number}> => {
  // Simulando a extração de interações de um texto
  const positiveInteractions = [
    { nutraceutical: 'Glucosamina', interaction: 'Melhora mobilidade articular', confidence: 0.85 },
    { nutraceutical: 'Ômega 3', interaction: 'Reduz inflamação', confidence: 0.92 },
    { nutraceutical: 'Curcumina', interaction: 'Anti-inflamatório natural', confidence: 0.78 },
    { nutraceutical: 'Probióticos', interaction: 'Melhora flora intestinal', confidence: 0.88 },
    { nutraceutical: 'CoQ10', interaction: 'Suporte cardíaco', confidence: 0.75 }
  ];
  
  const negativeInteractions = [
    { nutraceutical: 'Taurina', interaction: 'Interação com medicamentos cardíacos', confidence: 0.72 },
    { nutraceutical: 'Quitosana', interaction: 'Pode afetar absorção de nutrientes', confidence: 0.68 },
    { nutraceutical: 'Resveratrol', interaction: 'Interação com anticoagulantes', confidence: 0.77 },
    { nutraceutical: 'SAMe', interaction: 'Não recomendado com inibidores de serotonina', confidence: 0.81 }
  ];
  
  const numInteractions = Math.floor(Math.random() * 3) + 1; // 1 a 3 interações
  let selectedInteractions: Array<{nutraceutical: string, interaction: string, confidence: number}> = [];
  
  // Adicionar algumas interações positivas
  const shuffledPositive = [...positiveInteractions].sort(() => 0.5 - Math.random());
  for (let i = 0; i < Math.min(Math.ceil(numInteractions/2), shuffledPositive.length); i++) {
    selectedInteractions.push(shuffledPositive[i]);
  }
  
  // Adicionar algumas interações negativas
  const shuffledNegative = [...negativeInteractions].sort(() => 0.5 - Math.random());
  for (let i = 0; i < Math.min(Math.floor(numInteractions/2), shuffledNegative.length); i++) {
    selectedInteractions.push(shuffledNegative[i]);
  }
  
  return selectedInteractions;
};

export const extractSideEffectsFromStudy = (studyText: string): Array<{name: string, description: string, severity: string, confidence: number}> => {
  // Simulando a extração de efeitos colaterais de um texto
  const possibleSideEffects = [
    { name: 'Distúrbios GI', description: 'Distúrbios gastrointestinais leves', severity: 'leve', confidence: 0.82 },
    { name: 'Náusea', description: 'Náusea temporária', severity: 'leve', confidence: 0.78 },
    { name: 'Sonolência', description: 'Sonolência', severity: 'leve', confidence: 0.71 },
    { name: 'Reação alérgica', description: 'Reação alérgica', severity: 'moderado', confidence: 0.68 },
    { name: 'Diarreia', description: 'Diarreia', severity: 'moderado', confidence: 0.76 },
    { name: 'Vômito', description: 'Vômito', severity: 'moderado', confidence: 0.73 },
    { name: 'Alt. coagulação', description: 'Alteração da coagulação', severity: 'grave', confidence: 0.65 },
    { name: 'Hepatotoxicidade', description: 'Hepatotoxicidade em altas doses', severity: 'grave', confidence: 0.62 }
  ];
  
  // Decidir se há efeitos colaterais
  const hasSideEffects = Math.random() > 0.4; // 60% de chance de ter efeitos colaterais
  
  if (!hasSideEffects) {
    return [];
  }
  
  const numSideEffects = Math.floor(Math.random() * 2) + 1; // 1 a 2 efeitos colaterais
  const selectedSideEffects: Array<{name: string, description: string, severity: string, confidence: number}> = [];
  
  const shuffled = [...possibleSideEffects].sort(() => 0.5 - Math.random());
  for (let i = 0; i < Math.min(numSideEffects, shuffled.length); i++) {
    selectedSideEffects.push(shuffled[i]);
  }
  
  return selectedSideEffects;
};

export const simulateAnalysisResult = async (studyId: string, studyText: string): Promise<NtaiAnalysisResult> => {
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simular tempo de processamento
  
  const result: NtaiAnalysisResult = {
    studyId: studyId,
    qualityScore: scoreStudyQuality(studyId),
    relevanceScore: scoreStudyRelevance(studyId),
    extractedNutraceuticals: extractNutraceuticalsFromStudy(studyText),
    extractedConditions: extractConditionsFromStudy(studyText),
    extractedInteractions: extractInteractionsFromStudy(studyText),
    extractedSideEffects: extractSideEffectsFromStudy(studyText)
  };
  
  return result;
};
