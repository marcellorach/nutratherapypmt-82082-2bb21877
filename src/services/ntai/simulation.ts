
import { NtaiAnalysisResult } from '@/types/ntai';

// Função para simular a extração de nutracêuticos de um estudo
export const extractNutraceuticalsFromStudy = async (studyText: string, prompt?: string) => {
  // Simulação: extrai nutracêuticos baseados no texto do estudo
  const nutracêuticos = [
    { name: "Glucosamina", confidence: 0.95 },
    { name: "Condroitina", confidence: 0.88 },
    { name: "MSM", confidence: 0.82 },
    { name: "Ômega 3", confidence: 0.78 },
    { name: "Curcumina", confidence: 0.65 }
  ];
  
  // Verifica se o texto contém certas palavras-chave e adiciona nutracêuticos específicos
  if (studyText.toLowerCase().includes('articular') || studyText.toLowerCase().includes('joint')) {
    nutracêuticos.push({ name: "Colágeno Tipo II", confidence: 0.90 });
  }
  
  if (studyText.toLowerCase().includes('inflamação') || studyText.toLowerCase().includes('inflammation')) {
    nutracêuticos.push({ name: "Boswellia", confidence: 0.85 });
  }
  
  return nutracêuticos;
};

// Função para simular a extração de condições de saúde de um estudo
export const extractConditionsFromStudy = async (studyText: string, prompt?: string) => {
  // Simulação: extrai condições de saúde baseadas no texto do estudo
  const condições = [
    { name: "Artrite", efficacyScore: 4.2, confidence: 0.92 },
    { name: "Displasia", efficacyScore: 3.8, confidence: 0.84 },
    { name: "Dor crônica", efficacyScore: 3.5, confidence: 0.78 }
  ];
  
  // Adiciona condições específicas baseadas em palavras-chave
  if (studyText.toLowerCase().includes('idoso') || studyText.toLowerCase().includes('senior')) {
    condições.push({ name: "Envelhecimento", efficacyScore: 4.0, confidence: 0.88 });
  }
  
  return condições;
};

// Função para simular a extração de interações de um estudo
export const extractInteractionsFromStudy = async (studyText: string) => {
  // Simulação: extrai interações baseadas no texto do estudo
  return [
    { name: "Anti-inflamatórios", score: 3.8, type: "positive", confidence: 0.85 },
    { name: "Anticoagulantes", score: 2.1, type: "negative", confidence: 0.80 }
  ];
};

// Função para simular a extração de efeitos colaterais de um estudo
export const extractSideEffectsFromStudy = async (studyText: string) => {
  // Simulação: extrai efeitos colaterais baseados no texto do estudo
  return [
    { name: "Irritação gastrointestinal", severity: "low", confidence: 0.75 },
    { name: "Alterações na coagulação", severity: "moderate", confidence: 0.60 }
  ];
};

// Função para pontuar a qualidade do estudo
export const scoreStudyQuality = async (studyText: string) => {
  // Simulação: avalia a qualidade do estudo com base no comprimento e palavras-chave
  const baseScore = 3.5;
  let bonusScore = 0;
  
  // Adiciona pontos para estudos mais longos
  bonusScore += Math.min(studyText.length / 5000, 1.0);
  
  // Adiciona pontos para palavras-chave de qualidade
  const qualityTerms = [
    'randomizado', 'duplo-cego', 'placebo', 'significância estatística',
    'randomized', 'double-blind', 'statistically significant'
  ];
  
  for (const term of qualityTerms) {
    if (studyText.toLowerCase().includes(term)) bonusScore += 0.2;
  }
  
  return Math.min(baseScore + bonusScore, 5.0);
};

// Função para pontuar a relevância do estudo
export const scoreStudyRelevance = async (studyText: string) => {
  // Simulação: avalia a relevância do estudo com base em palavras-chave
  const baseScore = 3.0;
  let bonusScore = 0;
  
  const relevanceTerms = [
    'cão', 'cachorro', 'canino', 'veterinária', 'nutracêutico',
    'dog', 'canine', 'veterinary', 'nutraceutical'
  ];
  
  for (const term of relevanceTerms) {
    if (studyText.toLowerCase().includes(term)) bonusScore += 0.25;
  }
  
  return Math.min(baseScore + bonusScore, 5.0);
};

// Função principal para simular um resultado completo de análise
export const simulateAnalysisResult = async (
  studyId: string,
  studyText: string
): Promise<NtaiAnalysisResult> => {
  const [
    extractedNutraceuticals,
    extractedConditions,
    extractedInteractions,
    extractedSideEffects,
    qualityScore,
    relevanceScore
  ] = await Promise.all([
    extractNutraceuticalsFromStudy(studyText),
    extractConditionsFromStudy(studyText),
    extractInteractionsFromStudy(studyText),
    extractSideEffectsFromStudy(studyText),
    scoreStudyQuality(studyText),
    scoreStudyRelevance(studyText)
  ]);
  
  return {
    studyId,
    extractedNutraceuticals,
    extractedConditions,
    extractedInteractions,
    extractedSideEffects,
    qualityScore,
    relevanceScore,
    summary: `Estudo sobre os efeitos de nutracêuticos em saúde animal, com foco em ${extractedConditions[0]?.name || 'condições diversas'}.`,
    processedAt: new Date().toISOString()
  };
};

export default {
  extractNutraceuticalsFromStudy,
  extractConditionsFromStudy,
  extractInteractionsFromStudy,
  extractSideEffectsFromStudy,
  scoreStudyQuality,
  scoreStudyRelevance,
  simulateAnalysisResult
};
