
export interface EvidenceLevel {
  level: string;
  description: string;
  color: string;
  backgroundColor?: string;
  recommendationStrength: string;
  label?: string;
}

/**
 * Retorna o nível de evidência com base em uma pontuação (0-5)
 * @param score Pontuação de evidência (0-5)
 * @returns Objeto contendo informações sobre o nível de evidência
 */
export const getEvidenceLevel = (score: number): EvidenceLevel => {
  if (score >= 4.5) {
    return {
      level: 'Muito Alta',
      label: 'Muito Alta',
      description: 'Revisões sistemáticas e meta-análises de ensaios clínicos randomizados com alta qualidade metodológica',
      color: '#15803d', // green-700
      backgroundColor: 'rgba(21, 128, 61, 0.1)',
      recommendationStrength: 'Forte',
    };
  } else if (score >= 4.0) {
    return {
      level: 'Alta',
      label: 'Alta',
      description: 'Múltiplos ensaios clínicos randomizados com resultados consistentes',
      color: '#16a34a', // green-600
      backgroundColor: 'rgba(22, 163, 74, 0.1)',
      recommendationStrength: 'Forte',
    };
  } else if (score >= 3.5) {
    return {
      level: 'Média-Alta',
      label: 'Média-Alta',
      description: 'Ensaios clínicos randomizados ou estudos observacionais bem conduzidos',
      color: '#2563eb', // blue-600
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      recommendationStrength: 'Moderada',
    };
  } else if (score >= 3.0) {
    return {
      level: 'Média',
      label: 'Média',
      description: 'Estudos de caso-controle ou coorte com boa qualidade metodológica',
      color: '#3b82f6', // blue-500
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      recommendationStrength: 'Moderada',
    };
  } else if (score >= 2.0) {
    return {
      level: 'Média-Baixa',
      label: 'Média-Baixa',
      description: 'Séries de casos, estudos com limitações metodológicas',
      color: '#f59e0b', // amber-500
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      recommendationStrength: 'Fraca',
    };
  } else if (score >= 1.0) {
    return {
      level: 'Baixa',
      label: 'Baixa',
      description: 'Opiniões de especialistas, estudos de caso isolados',
      color: '#f97316', // orange-500
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      recommendationStrength: 'Fraca',
    };
  } else {
    return {
      level: 'Muito Baixa',
      label: 'Muito Baixa',
      description: 'Evidência anedótica ou sem estudos formais',
      color: '#9ca3af', // gray-400
      backgroundColor: 'rgba(156, 163, 175, 0.1)',
      recommendationStrength: 'Muito fraca ou insuficiente',
    };
  }
};

// Definição de níveis de evidência para uso no ScientificScoreIndex
export const EvidenceLevels = {
  muitoAlta: {
    label: 'Muito Alta',
    color: '#15803d',
    range: [4.5, 5.0]
  },
  alta: {
    label: 'Alta',
    color: '#16a34a',
    range: [4.0, 4.4]
  },
  mediaAlta: {
    label: 'Média-Alta',
    color: '#2563eb',
    range: [3.5, 3.9]
  },
  media: {
    label: 'Média',
    color: '#3b82f6',
    range: [3.0, 3.4]
  },
  mediaBaixa: {
    label: 'Média-Baixa',
    color: '#f59e0b',
    range: [2.0, 2.9]
  },
  baixa: {
    label: 'Baixa',
    color: '#f97316',
    range: [1.0, 1.9]
  },
  muitoBaixa: {
    label: 'Muito Baixa',
    color: '#9ca3af',
    range: [0, 0.9]
  }
};

/**
 * Obtém a cor correspondente a uma pontuação de eficácia em escala de 0-100
 * @param efficacyScore Pontuação de eficácia (0-100)
 * @returns String de cor em formato hex ou rgba
 */
export const getEfficacyColor = (efficacyScore: number): string => {
  if (efficacyScore >= 80) return '#15803d'; // green-700
  if (efficacyScore >= 60) return '#2563eb'; // blue-600 
  if (efficacyScore >= 40) return '#f59e0b'; // amber-500
  return '#9ca3af'; // gray-400
};

/**
 * Converte pontuação em escala de 0-100 para escala de 0-5
 * @param score Pontuação em escala de 0-100
 * @returns Pontuação em escala de 0-5
 */
export const convertTo5Scale = (score: number): number => {
  return (score / 100) * 5;
};

/**
 * Converte pontuação em escala de 0-5 para escala de 0-100
 * @param score Pontuação em escala de 0-5
 * @returns Pontuação em escala de 0-100
 */
export const convertTo100Scale = (score: number): number => {
  return (score / 5) * 100;
};
