
import { NtaiAnalysisResult, NtaiNutraceuticalTag, NtaiConditionTag, NtaiInteractionTag, NtaiSideEffectTag } from '@/types/ntai';

// Mock API Key para simulação
const OPENAI_API_KEY = 'sk-mock-key-for-prototype';
const GPT_MODEL = 'gpt-4.5-preview';

export const extractNutraceuticalsFromStudy = async (studyText: string): Promise<NtaiNutraceuticalTag[]> => {
  // Em um ambiente real, esta função enviaria o texto para a API da OpenAI
  // Para o protótipo, vamos simular um resultado
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simula tempo de processamento
  
  return [
    { name: "Ômega 3", confidence: 0.94 },
    { name: "Ômega 6", confidence: 0.92 },
    { name: "DHA", confidence: 0.89 },
    { name: "EPA", confidence: 0.85 }
  ];
};

export const extractConditionsFromStudy = async (studyText: string): Promise<NtaiConditionTag[]> => {
  await new Promise(resolve => setTimeout(resolve, 1800)); // Simula tempo de processamento
  
  return [
    { name: "Artrite Canina", efficacyScore: 4.2, confidence: 0.95 },
    { name: "Inflamação Articular", efficacyScore: 3.8, confidence: 0.92 },
    { name: "Mobilidade Reduzida", efficacyScore: 3.5, confidence: 0.85 }
  ];
};

export const extractInteractionsFromStudy = async (studyText: string): Promise<NtaiInteractionTag[]> => {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simula tempo de processamento
  
  return [
    { name: "Glucosamina", score: 4.0, type: 'positive', confidence: 0.92 },
    { name: "Vitamina E", score: 3.5, type: 'positive', confidence: 0.89 },
    { name: "Anti-inflamatórios", score: 2.5, type: 'negative', confidence: 0.86 },
    { name: "Anticoagulantes", score: 3.8, type: 'negative', confidence: 0.94 }
  ];
};

export const extractSideEffectsFromStudy = async (studyText: string): Promise<NtaiSideEffectTag[]> => {
  await new Promise(resolve => setTimeout(resolve, 1700)); // Simula tempo de processamento
  
  return [
    { name: "Sonolência", intensityScore: 2.0, frequency: "raro", confidence: 0.88 },
    { name: "Alterações Gastrointestinais", intensityScore: 2.5, frequency: "ocasional", confidence: 0.91 },
    { name: "Alterações no Apetite", intensityScore: 1.5, frequency: "raro", confidence: 0.83 }
  ];
};

export const scoreStudyQuality = async (studyText: string): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 1200)); // Simula tempo de processamento
  
  // Simula uma pontuação entre 3.0 e 5.0
  return 3.0 + Math.random() * 2.0;
};

export const scoreStudyRelevance = async (studyText: string): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simula tempo de processamento
  
  // Simula uma pontuação entre 2.5 e 5.0
  return 2.5 + Math.random() * 2.5;
};

export const analyzeStudy = async (studyId: string, studyText: string): Promise<NtaiAnalysisResult> => {
  // Em um ambiente de produção, isso seria feito com uma única chamada à API da OpenAI
  // com um prompt especializado que retornaria todos os dados necessários
  
  // Para o protótipo, vamos chamar cada função separadamente
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
    relevanceScore
  };
};

export default {
  analyzeStudy,
  extractNutraceuticalsFromStudy,
  extractConditionsFromStudy,
  extractInteractionsFromStudy,
  extractSideEffectsFromStudy,
  scoreStudyQuality,
  scoreStudyRelevance
};
