
export const EvidenceLevels = {
  EXCELLENT: {
    range: [4, 5],
    color: '#3b82f6', // Azul
    backgroundColor: '#F2FCE2', // Verde suave
    label: 'Excelente evidência'
  },
  GOOD: {
    range: [3, 3.9],
    color: '#10b981', // Verde
    backgroundColor: '#FEF7CD', // Amarelo suave
    label: 'Boa evidência'
  },
  MODERATE: {
    range: [2, 2.9],
    color: '#6366f1', // Índigo
    backgroundColor: '#D3E4FD', // Azul suave
    label: 'Evidência moderada'
  },
  LIMITED: {
    range: [1, 1.9],
    color: '#f59e0b', // Âmbar
    backgroundColor: '#FEC6A1', // Laranja suave
    label: 'Evidência limitada'
  },
  NONE: {
    range: [0, 0.9],
    color: '#ef4444', // Vermelho
    backgroundColor: '#fee2e2', // Vermelho suave
    label: 'Sem evidência significativa'
  }
};

export const getEvidenceLevel = (score: number) => {
  for (const [key, level] of Object.entries(EvidenceLevels)) {
    if (score >= level.range[0] && score <= level.range[1]) {
      return { 
        key, 
        ...level 
      };
    }
  }
  return { 
    key: 'NONE', 
    ...EvidenceLevels.NONE 
  };
};
