
/**
 * Gera condições de saúde relacionadas ao tratamento principal
 */
export const generateHealthConditions = (condition: string): string[] => {
  const mainCondition = condition;
  const relatedConditions: Record<string, string[]> = {
    "Dermatite atópica": ["Ressecamento da pele", "Alergia sazonal", "Prurido"],
    "Problemas articulares": ["Artrite", "Displasia", "Dor crônica"],
    "Sistema imunológico": ["Infecções recorrentes", "Alergias", "Baixa imunidade"],
    "Problemas cardíacos": ["Arritmia", "Hipertensão", "Fadiga"],
    "Problemas cognitivos": ["Desorientação", "Perda de memória", "Ansiedade"],
    "Suporte hepático": ["Enzimas alteradas", "Metabolismo lento", "Toxicidade"]
  };
  
  // Encontrar a categoria mais próxima
  let category = Object.keys(relatedConditions).find(c => 
    mainCondition.toLowerCase().includes(c.toLowerCase())
  ) || Object.keys(relatedConditions)[0];
  
  return [
    mainCondition,
    ...relatedConditions[category as keyof typeof relatedConditions].slice(0, 2)
  ];
};

/**
 * Calcula taxas de sucesso baseadas na pontuação de eficácia
 */
export const calculateSuccessRates = (calculatedEfficacyScore: number) => {
  const efficacyRate = Math.min(100, Math.round(calculatedEfficacyScore * 20));
  return {
    // Taxa para estudos científicos
    estudos: {
      eficaz: Math.round(efficacyRate * 0.9),
      baixaEficacia: Math.min(100 - Math.round(efficacyRate * 0.9), Math.round((100 - Math.round(efficacyRate * 0.9)) * 0.7)),
      ineficaz: Math.max(0, 100 - Math.round(efficacyRate * 0.9) - Math.min(100 - Math.round(efficacyRate * 0.9), Math.round((100 - Math.round(efficacyRate * 0.9)) * 0.7))),
    },
    // Taxa para população PetLove
    petlove: {
      eficaz: efficacyRate,
      baixaEficacia: Math.min(100 - efficacyRate, Math.round((100 - efficacyRate) * 0.8)),
      ineficaz: Math.max(0, 100 - efficacyRate - Math.min(100 - efficacyRate, Math.round((100 - efficacyRate) * 0.8))),
    },
    // Tempo médio de resposta
    tempoMedio: Math.max(5, Math.round(25 - calculatedEfficacyScore * 2)),
  };
};

/**
 * Gera dados para o gráfico de condições de saúde
 */
export const generateHealthConditionData = (
  healthConditions: string[], 
  calculatedEfficacyScore: number
) => {
  return healthConditions.map(cond => {
    // Variação da eficácia para diferentes condições
    const variationFactor = cond === healthConditions[0] ? 1 : 0.7 + Math.random() * 0.4;
    
    return {
      name: cond,
      estudos: Math.round(calculatedEfficacyScore * 15 * variationFactor),
      petlove: Math.min(95, Math.round(calculatedEfficacyScore * 18 * variationFactor * (1 + Math.random() * 0.2))),
    };
  });
};

/**
 * Gera um número total de casos aleatório
 */
export const generateTotalCases = () => {
  return Math.floor(Math.random() * (42000 - 1800 + 1) + 1800);
};
