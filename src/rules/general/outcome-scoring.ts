
/**
 * Sistema de pontuação para outcomes específicos
 * 
 * Score por Outcome (0-5)
 * - Eficácia Comprovada (50%)
 * - Reprodutibilidade (25%)
 * - Tempo até Resultado (15%)
 * - População Beneficiada (10%)
 */

export interface OutcomeScoreInputs {
  efficacy: number;          // Eficácia comprovada (0-5)
  reproducibility: number;   // Reprodutibilidade em diferentes estudos (0-5)
  timeToResult: number;      // Tempo até resultado (0-5, 5 é mais rápido)
  populationBreadth: number; // Amplitude da população beneficiada (0-5)
}

export const calculateOutcomeScore = (inputs: OutcomeScoreInputs): number => {
  const score = (
    inputs.efficacy * 0.5 +
    inputs.reproducibility * 0.25 +
    inputs.timeToResult * 0.15 +
    inputs.populationBreadth * 0.1
  );
  
  return parseFloat(score.toFixed(1));
};
