
import { 
  NtaiNutraceuticalTag, 
  NtaiConditionTag, 
  NtaiInteractionTag, 
  NtaiSideEffectTag,
  NtaiAnalysisResult
} from '@/types/ntai';

// Lista de nutracêuticos comuns
const commonNutraceuticals = [
  'Ômega 3', 'Ômega 6', 'Glucosamina', 'Condroitina', 'MSM', 
  'Curcumina', 'Extrato de Gengibre', 'Extrato de Boswellia',
  'Vitamina E', 'Vitamina C', 'CoQ10', 'Probióticos', 
  'Extrato de Mexilhão de Lábio Verde', 'Ácido Hialurônico',
  'CBD', 'L-Carnitina', 'Taurina', 'Resveratrol', 'Quercetina'
];

// Lista de condições comuns em pets
const commonConditions = [
  'Artrite', 'Displasia Coxofemoral', 'Osteoartrite', 'Dermatite Atópica',
  'Alergias Alimentares', 'Gengivite', 'Doença Periodontal', 'Obesidade',
  'Diabetes', 'Insuficiência Cardíaca', 'Doença Renal Crônica', 'Ansiedade',
  'Problemas Digestivos', 'Inflamação Intestinal', 'Degeneração Cognitiva',
  'Problemas Hepáticos', 'Hipertireoidismo', 'Hipotireoidismo', 'Epilepsia'
];

// Lista de interações comuns
const commonInteractions = [
  { name: 'Anti-inflamatórios', type: 'negative' },
  { name: 'Glicocorticoides', type: 'negative' },
  { name: 'Anticoagulantes', type: 'negative' },
  { name: 'Antidepressivos', type: 'negative' },
  { name: 'Vitamina K', type: 'negative' },
  { name: 'Glucosamina', type: 'positive' },
  { name: 'Condroitina', type: 'positive' },
  { name: 'Probióticos', type: 'positive' },
  { name: 'Vitamina E', type: 'positive' },
  { name: 'Ácidos Graxos Essenciais', type: 'positive' }
];

// Lista de efeitos colaterais comuns
const commonSideEffects = [
  { name: 'Vômito', frequency: 'raro' },
  { name: 'Diarreia', frequency: 'ocasional' },
  { name: 'Sonolência', frequency: 'raro' },
  { name: 'Alterações no apetite', frequency: 'comum' },
  { name: 'Alterações no comportamento', frequency: 'raro' },
  { name: 'Aumento de enzimas hepáticas', frequency: 'raro' },
  { name: 'Irritação gastrointestinal', frequency: 'comum' }
];

// Função para extrair nutracêuticos do texto
export const extractNutraceuticalsFromStudy = async (
  studyText: string, 
  customPrompt?: string
): Promise<NtaiNutraceuticalTag[]> => {
  // Simulando extração baseada em palavras-chave no texto
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Selecionando aleatoriamente 2-5 nutracêuticos baseado em seed do texto
  const hash = studyText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const count = 2 + (hash % 4); // 2 a 5 nutracêuticos
  
  const extractedNutraceuticals: NtaiNutraceuticalTag[] = [];
  const usedIndices = new Set<number>();
  
  for (let i = 0; i < count; i++) {
    let index;
    do {
      index = (hash + i * 123) % commonNutraceuticals.length;
    } while (usedIndices.has(index));
    
    usedIndices.add(index);
    extractedNutraceuticals.push({
      name: commonNutraceuticals[index],
      confidence: 0.5 + (Math.random() * 0.5) // Confiança entre 0.5 e 1
    });
  }
  
  return extractedNutraceuticals;
};

// Função para extrair condições de saúde do texto
export const extractConditionsFromStudy = async (
  studyText: string,
  customPrompt?: string
): Promise<NtaiConditionTag[]> => {
  await new Promise(resolve => setTimeout(resolve, 1800));
  
  // Selecionando aleatoriamente 1-4 condições baseado em seed do texto
  const hash = studyText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const count = 1 + (hash % 4); // 1 a 4 condições
  
  const extractedConditions: NtaiConditionTag[] = [];
  const usedIndices = new Set<number>();
  
  for (let i = 0; i < count; i++) {
    let index;
    do {
      index = (hash + i * 456) % commonConditions.length;
    } while (usedIndices.has(index));
    
    usedIndices.add(index);
    extractedConditions.push({
      name: commonConditions[index],
      efficacyScore: 1 + Math.random() * 4, // Eficácia entre 1 e 5
      confidence: 0.6 + (Math.random() * 0.4) // Confiança entre 0.6 e 1
    });
  }
  
  return extractedConditions;
};

// Função para extrair interações do texto
export const extractInteractionsFromStudy = async (
  studyText: string
): Promise<NtaiInteractionTag[]> => {
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Selecionando aleatoriamente 0-3 interações baseado em seed do texto
  const hash = studyText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const count = hash % 4; // 0 a 3 interações
  
  const extractedInteractions: NtaiInteractionTag[] = [];
  const usedIndices = new Set<number>();
  
  for (let i = 0; i < count; i++) {
    let index;
    do {
      index = (hash + i * 789) % commonInteractions.length;
    } while (usedIndices.has(index));
    
    usedIndices.add(index);
    const interaction = commonInteractions[index];
    
    extractedInteractions.push({
      name: interaction.name,
      score: 1 + Math.random() * 4, // Pontuação entre 1 e 5
      type: interaction.type as 'positive' | 'negative',
      confidence: 0.6 + (Math.random() * 0.4) // Confiança entre 0.6 e 1
    });
  }
  
  return extractedInteractions;
};

// Função para extrair efeitos colaterais do texto
export const extractSideEffectsFromStudy = async (
  studyText: string
): Promise<NtaiSideEffectTag[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Selecionando aleatoriamente 0-2 efeitos colaterais baseado em seed do texto
  const hash = studyText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const count = hash % 3; // 0 a 2 efeitos colaterais
  
  const extractedSideEffects: NtaiSideEffectTag[] = [];
  const usedIndices = new Set<number>();
  
  for (let i = 0; i < count; i++) {
    let index;
    do {
      index = (hash + i * 321) % commonSideEffects.length;
    } while (usedIndices.has(index));
    
    usedIndices.add(index);
    const sideEffect = commonSideEffects[index];
    
    extractedSideEffects.push({
      name: sideEffect.name,
      intensityScore: 1 + Math.random() * 4, // Intensidade entre 1 e 5
      frequency: sideEffect.frequency,
      confidence: 0.5 + (Math.random() * 0.5) // Confiança entre 0.5 e 1
    });
  }
  
  return extractedSideEffects;
};

// Função para simular o resultado completo da análise
export const simulateAnalysisResult = async (studyId: string, studyText: string): Promise<NtaiAnalysisResult> => {
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

// Funções de pontuação
export const scoreStudyQuality = async (studyText: string): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const hash = studyText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 2.5 + ((hash % 25) / 10); // Pontuação entre 2.5 e 5.0
};

export const scoreStudyRelevance = async (studyText: string): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 700));
  const hash = studyText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 2.0 + ((hash % 30) / 10); // Pontuação entre 2.0 e 5.0
};
