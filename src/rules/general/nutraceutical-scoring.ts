
/**
 * Sistema de pontuação para nutracêuticos
 * 
 * Score Global (0-5)
 * - Qualidade Científica (40%)
 *   - Número e qualidade dos estudos
 *   - Rigor metodológico
 *   - Diversidade de populações
 * - Segurança (30%)
 *   - Perfil toxicológico
 *   - Efeitos colaterais
 *   - Tolerabilidade
 * - Potencial Terapêutico (30%)
 *   - Amplitude de aplicações
 *   - Mecanismo de ação
 *   - Potencial preventivo/terapêutico
 */

export interface ScientificQualityScore {
  studyCount: number;          // Número de estudos
  methodologyScore: number;    // Rigor metodológico (0-5)
  populationDiversity: number; // Diversidade de populações (0-5)
}

export interface SafetyScore {
  toxicologyProfile: number;   // Perfil toxicológico (0-5, 5 é mais seguro)
  sideEffects: number;         // Efeitos colaterais (0-5, 5 é menos efeitos)
  tolerability: number;        // Tolerabilidade (0-5)
}

export interface TherapeuticPotentialScore {
  applicationsScope: number;   // Amplitude de aplicações (0-5)
  mechanismKnowledge: number;  // Conhecimento do mecanismo (0-5)
  preventiveTherapeutic: number; // Potencial preventivo/terapêutico (0-5)
}

export interface NutraceuticalScoreInputs {
  scientificQuality: ScientificQualityScore;
  safety: SafetyScore;
  therapeuticPotential: TherapeuticPotentialScore;
}

export const calculateNutraceuticalScore = (inputs: NutraceuticalScoreInputs): number => {
  // Normalizar contagem de estudos para escala 0-5
  const normalizedStudyCount = Math.min(inputs.scientificQuality.studyCount / 20, 5);
  
  // Calcular sub-scores
  const scientificQualityScore = (
    normalizedStudyCount * 0.4 +
    inputs.scientificQuality.methodologyScore * 0.4 +
    inputs.scientificQuality.populationDiversity * 0.2
  );
  
  const safetyScore = (
    inputs.safety.toxicologyProfile * 0.4 +
    inputs.safety.sideEffects * 0.3 +
    inputs.safety.tolerability * 0.3
  );
  
  const therapeuticPotentialScore = (
    inputs.therapeuticPotential.applicationsScope * 0.4 +
    inputs.therapeuticPotential.mechanismKnowledge * 0.3 +
    inputs.therapeuticPotential.preventiveTherapeutic * 0.3
  );
  
  // Calcular score final com pesos
  const finalScore = (
    scientificQualityScore * 0.4 +
    safetyScore * 0.3 +
    therapeuticPotentialScore * 0.3
  );
  
  // Arredondar para uma casa decimal
  return parseFloat(finalScore.toFixed(1));
};
