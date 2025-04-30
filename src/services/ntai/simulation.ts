
import { NtaiAnalysisResult } from "@/types/ntai";

/**
 * Extrai nutracêuticos mencionados no texto de um estudo
 */
export const extractNutraceuticalsFromStudy = (text: string): { name: string, confidence: number }[] => {
  // Palavras-chave para nutracêuticos comuns
  const keywords = [
    "Ômega-3", "Curcumina", "Glucosamina", "Condroitina", "Resveratrol",
    "CoQ10", "MSM", "Probiótico", "Própolis", "Spirulina",
    "Ashwagandha", "SAMe", "L-carnitina", "Silimarina", "CBD"
  ];
  
  const results: { name: string, confidence: number }[] = [];
  
  keywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      const randomConfidence = 0.7 + Math.random() * 0.29; // Entre 0.7 e 0.99
      results.push({
        name: keyword,
        confidence: randomConfidence
      });
    }
  });
  
  // Adicionar alguns nutracêuticos aleatórios para diversidade nos dados simulados
  if (results.length < 3) {
    const randomNutraceuticals = [
      "Vitamina E", "Zinco Quelato", "Quercetina", "Extrato de Cardo Mariano", 
      "Colágeno Tipo II", "L-glutamina", "Extrato de Gengibre"
    ];
    
    const numToAdd = Math.min(3 - results.length, randomNutraceuticals.length);
    
    for (let i = 0; i < numToAdd; i++) {
      results.push({
        name: randomNutraceuticals[i],
        confidence: 0.6 + Math.random() * 0.2 // Entre 0.6 e 0.8
      });
    }
  }
  
  return results;
};

/**
 * Extrai condições de saúde mencionadas no texto de um estudo
 */
export const extractConditionsFromStudy = (text: string): { name: string, confidence: number }[] => {
  // Palavras-chave para condições comuns
  const keywords = [
    "Artrite", "Osteoartrite", "Doença inflamatória intestinal", "Dermatite",
    "Alergias", "Obesidade", "Doença renal", "Doença hepática", "Ansiedade",
    "Problemas cardíacos", "Diabetes", "Cistite", "Epilepsia"
  ];
  
  const results: { name: string, confidence: number }[] = [];
  
  keywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      const randomConfidence = 0.75 + Math.random() * 0.24; // Entre 0.75 e 0.99
      results.push({
        name: keyword,
        confidence: randomConfidence
      });
    }
  });
  
  // Adicionar algumas condições aleatórias
  if (results.length < 2) {
    const randomConditions = [
      "Inflamação crônica", "Problemas cognitivos", "Distúrbios gastrointestinais",
      "Problemas de pele", "Baixa imunidade"
    ];
    
    const numToAdd = Math.min(2 - results.length, randomConditions.length);
    
    for (let i = 0; i < numToAdd; i++) {
      results.push({
        name: randomConditions[i],
        confidence: 0.65 + Math.random() * 0.2 // Entre 0.65 e 0.85
      });
    }
  }
  
  return results;
};

/**
 * Extrai interações mencionadas no texto de um estudo
 */
export const extractInteractionsFromStudy = (text: string): { nutraceutical: string, interaction: string, confidence: number }[] => {
  // Para simulação, vamos gerar interações fictícias
  const possibleInteractions = [
    { 
      nutraceutical: "Ômega-3", 
      interaction: "Potencializa o efeito anti-inflamatório quando combinado com curcumina", 
      confidence: 0.8
    },
    { 
      nutraceutical: "Curcumina", 
      interaction: "Interação sinérgica com boswellia para redução de inflamação", 
      confidence: 0.75
    },
    { 
      nutraceutical: "Probiótico", 
      interaction: "Melhora a absorção de minerais no trato digestivo", 
      confidence: 0.72
    },
    { 
      nutraceutical: "Glucosamina", 
      interaction: "Eficácia aumentada quando combinada com condroitina", 
      confidence: 0.85
    },
    { 
      nutraceutical: "Resveratrol", 
      interaction: "Não recomendado uso concomitante com medicamentos anticoagulantes", 
      confidence: 0.78
    }
  ];
  
  // Selecionar aleatoriamente 2-3 interações
  const numInteractions = 2 + Math.floor(Math.random() * 2); // 2 ou 3
  const selectedIndices = new Set<number>();
  
  while (selectedIndices.size < numInteractions && selectedIndices.size < possibleInteractions.length) {
    const randomIndex = Math.floor(Math.random() * possibleInteractions.length);
    selectedIndices.add(randomIndex);
  }
  
  return Array.from(selectedIndices).map(index => possibleInteractions[index]);
};

/**
 * Extrai efeitos colaterais mencionados no texto de um estudo
 */
export const extractSideEffectsFromStudy = (text: string): { name: string, description: string, severity: string, confidence: number }[] => {
  // Para simulação, vamos gerar efeitos colaterais fictícios
  const possibleSideEffects = [
    {
      name: "Distúrbios gastrointestinais leves",
      description: "Alguns pacientes reportaram náusea e desconforto abdominal",
      severity: "Leve",
      confidence: 0.73
    },
    {
      name: "Sonolência",
      description: "Pode causar sonolência em doses elevadas",
      severity: "Moderado",
      confidence: 0.65
    },
    {
      name: "Alteração da coagulação",
      description: "Pode afetar os tempos de coagulação, risco para procedimentos cirúrgicos",
      severity: "Moderado",
      confidence: 0.82
    },
    {
      name: "Reações alérgicas cutâneas",
      description: "Observadas reações cutâneas em indivíduos sensíveis",
      severity: "Moderado",
      confidence: 0.68
    },
    {
      name: "Redução dos níveis de glicose",
      description: "Pode causar hipoglicemia em pacientes diabéticos",
      severity: "Severo",
      confidence: 0.79
    }
  ];
  
  // Selecionar aleatoriamente 1-2 efeitos
  const numEffects = 1 + Math.floor(Math.random() * 2); // 1 ou 2
  const selectedIndices = new Set<number>();
  
  while (selectedIndices.size < numEffects && selectedIndices.size < possibleSideEffects.length) {
    const randomIndex = Math.floor(Math.random() * possibleSideEffects.length);
    selectedIndices.add(randomIndex);
  }
  
  return Array.from(selectedIndices).map(index => possibleSideEffects[index]);
};

/**
 * Calcula uma pontuação de qualidade para o estudo
 */
export const scoreStudyQuality = (text: string): number => {
  // Para simulação, gera uma pontuação aleatória entre 2.0 e 5.0
  return 2.0 + Math.random() * 3.0;
};

/**
 * Calcula uma pontuação de relevância para o estudo
 */
export const scoreStudyRelevance = (text: string): number => {
  // Para simulação, gera uma pontuação aleatória entre 2.5 e 4.8
  return 2.5 + Math.random() * 2.3;
};

/**
 * Gera um resultado de análise NTAI simulado para testes
 */
export const simulateAnalysisResult = async (studyId: string, text: string): Promise<NtaiAnalysisResult> => {
  const nutraceuticals = extractNutraceuticalsFromStudy(text);
  const conditions = extractConditionsFromStudy(text);
  const interactions = extractInteractionsFromStudy(text);
  const sideEffects = extractSideEffectsFromStudy(text);
  
  return {
    studyId,
    qualityScore: scoreStudyQuality(text),
    relevanceScore: scoreStudyRelevance(text),
    extractedNutraceuticals: nutraceuticals,
    extractedConditions: conditions,
    extractedInteractions: interactions,
    extractedSideEffects: sideEffects
  };
};
