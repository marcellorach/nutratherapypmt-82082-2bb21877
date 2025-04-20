
/**
 * Sistema de pontuação para sinergias entre nutracêuticos
 * 
 * Score de Sinergia (0-5)
 * - Potência do Efeito (40%)
 * - Consistência (30%)
 * - Facilidade de Combinação (30%)
 */

export interface SynergyScoreInputs {
  potency: number;     // Potência do efeito combinado (0-5)
  consistency: number; // Consistência dos resultados (0-5)
  combination: number; // Facilidade de combinação (0-5)
}

export const calculateSynergyScore = (inputs: SynergyScoreInputs): number => {
  const score = (
    inputs.potency * 0.4 +
    inputs.consistency * 0.3 +
    inputs.combination * 0.3
  );
  
  return parseFloat(score.toFixed(1));
};
