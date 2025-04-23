
import { NtaiAnalysisResult, NtaiNutraceuticalTag, NtaiConditionTag, NtaiInteractionTag, NtaiSideEffectTag } from '@/types/ntai';

export const extractNutraceuticalsFromStudy = async (
  studyText: string,
  prompt?: string
): Promise<NtaiNutraceuticalTag[]> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  console.log('Usando prompt para extração de nutracêuticos:', prompt);
  
  return [
    { name: "Ômega 3", confidence: 0.94 },
    { name: "Ômega 6", confidence: 0.92 },
    { name: "DHA", confidence: 0.89 },
    { name: "EPA", confidence: 0.85 }
  ];
};

export const extractConditionsFromStudy = async (
  studyText: string,
  prompt?: string
): Promise<NtaiConditionTag[]> => {
  await new Promise(resolve => setTimeout(resolve, 1800));
  console.log('Usando prompt para extração de condições:', prompt);
  
  return [
    { name: "Artrite Canina", efficacyScore: 4.2, confidence: 0.95 },
    { name: "Inflamação Articular", efficacyScore: 3.8, confidence: 0.92 },
    { name: "Mobilidade Reduzida", efficacyScore: 3.5, confidence: 0.85 }
  ];
};

export const extractInteractionsFromStudy = async (
  studyText: string
): Promise<NtaiInteractionTag[]> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return [
    { name: "Glucosamina", score: 4.0, type: 'positive', confidence: 0.92 },
    { name: "Vitamina E", score: 3.5, type: 'positive', confidence: 0.89 },
    { name: "Anti-inflamatórios", score: 2.5, type: 'negative', confidence: 0.86 },
    { name: "Anticoagulantes", score: 3.8, type: 'negative', confidence: 0.94 }
  ];
};

export const extractSideEffectsFromStudy = async (
  studyText: string
): Promise<NtaiSideEffectTag[]> => {
  await new Promise(resolve => setTimeout(resolve, 1700));
  
  return [
    { name: "Sonolência", intensityScore: 2.0, frequency: "raro", confidence: 0.88 },
    { name: "Alterações Gastrointestinais", intensityScore: 2.5, frequency: "ocasional", confidence: 0.91 },
    { name: "Alterações no Apetite", intensityScore: 1.5, frequency: "raro", confidence: 0.83 }
  ];
};

export const simulateAnalysisResult = (studyId: string): NtaiAnalysisResult => {
  return {
    studyId,
    extractedNutraceuticals: [
      { name: "Ômega 3", confidence: 0.94 },
      { name: "Ômega 6", confidence: 0.92 },
      { name: "DHA", confidence: 0.89 },
      { name: "EPA", confidence: 0.85 }
    ],
    extractedConditions: [
      { name: "Artrite Canina", efficacyScore: 4.2, confidence: 0.95 },
      { name: "Inflamação Articular", efficacyScore: 3.8, confidence: 0.92 },
      { name: "Mobilidade Reduzida", efficacyScore: 3.5, confidence: 0.85 }
    ],
    extractedInteractions: [
      { name: "Glucosamina", score: 4.0, type: 'positive', confidence: 0.92 },
      { name: "Vitamina E", score: 3.5, type: 'positive', confidence: 0.89 },
      { name: "Anti-inflamatórios", score: 2.5, type: 'negative', confidence: 0.86 },
      { name: "Anticoagulantes", score: 3.8, type: 'negative', confidence: 0.94 }
    ],
    extractedSideEffects: [
      { name: "Sonolência", intensityScore: 2.0, frequency: "raro", confidence: 0.88 },
      { name: "Alterações Gastrointestinais", intensityScore: 2.5, frequency: "ocasional", confidence: 0.91 },
      { name: "Alterações no Apetite", intensityScore: 1.5, frequency: "raro", confidence: 0.83 }
    ],
    qualityScore: 4.2,
    relevanceScore: 3.8
  };
};
