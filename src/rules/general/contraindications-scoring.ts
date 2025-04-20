
/**
 * Sistema de pontuação para contraindicações
 * 
 * Score de Risco (0-5, onde 5 é o mais arriscado)
 * - Severidade do Efeito (40%)
 * - Frequência de Ocorrência (30%)
 * - Reversibilidade (30%)
 */

export interface ContraindicationScoreInputs {
  severity: number;      // Severidade do efeito (0-5)
  frequency: number;     // Frequência de ocorrência (0-5)
  reversibility: number; // Reversibilidade (0-5, 5 é irreversível)
}

export const calculateContraindicationScore = (inputs: ContraindicationScoreInputs): number => {
  const score = (
    inputs.severity * 0.4 +
    inputs.frequency * 0.3 +
    inputs.reversibility * 0.3
  );
  
  return parseFloat(score.toFixed(1));
};
