
export interface EvidenceLevel {
  level: string;
  description: string;
  color: string;
  backgroundColor?: string;
  recommendationStrength: string;
  label?: string;
}

// i18n keys for evidence levels
export const evidenceLevelKeys = {
  veryHigh: { levelKey: 'evidenceLevels.veryHigh', strengthKey: 'evidenceLevels.strength.strong' },
  high: { levelKey: 'evidenceLevels.high', strengthKey: 'evidenceLevels.strength.strong' },
  mediumHigh: { levelKey: 'evidenceLevels.mediumHigh', strengthKey: 'evidenceLevels.strength.moderate' },
  medium: { levelKey: 'evidenceLevels.medium', strengthKey: 'evidenceLevels.strength.moderate' },
  mediumLow: { levelKey: 'evidenceLevels.mediumLow', strengthKey: 'evidenceLevels.strength.weak' },
  low: { levelKey: 'evidenceLevels.low', strengthKey: 'evidenceLevels.strength.weak' },
  veryLow: { levelKey: 'evidenceLevels.veryLow', strengthKey: 'evidenceLevels.strength.veryWeak' },
};

/**
 * Returns the evidence level based on a score (0-5).
 * Labels are i18n keys — pass result through t() for display.
 */
export const getEvidenceLevel = (score: number): EvidenceLevel => {
  if (score >= 4.5) {
    return {
      level: 'evidenceLevels.veryHigh',
      label: 'evidenceLevels.veryHigh',
      description: 'evidenceLevels.desc.veryHigh',
      color: '#15803d',
      backgroundColor: 'rgba(21, 128, 61, 0.1)',
      recommendationStrength: 'evidenceLevels.strength.strong',
    };
  } else if (score >= 4.0) {
    return {
      level: 'evidenceLevels.high',
      label: 'evidenceLevels.high',
      description: 'evidenceLevels.desc.high',
      color: '#16a34a',
      backgroundColor: 'rgba(22, 163, 74, 0.1)',
      recommendationStrength: 'evidenceLevels.strength.strong',
    };
  } else if (score >= 3.5) {
    return {
      level: 'evidenceLevels.mediumHigh',
      label: 'evidenceLevels.mediumHigh',
      description: 'evidenceLevels.desc.mediumHigh',
      color: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      recommendationStrength: 'evidenceLevels.strength.moderate',
    };
  } else if (score >= 3.0) {
    return {
      level: 'evidenceLevels.medium',
      label: 'evidenceLevels.medium',
      description: 'evidenceLevels.desc.medium',
      color: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      recommendationStrength: 'evidenceLevels.strength.moderate',
    };
  } else if (score >= 2.0) {
    return {
      level: 'evidenceLevels.mediumLow',
      label: 'evidenceLevels.mediumLow',
      description: 'evidenceLevels.desc.mediumLow',
      color: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      recommendationStrength: 'evidenceLevels.strength.weak',
    };
  } else if (score >= 1.0) {
    return {
      level: 'evidenceLevels.low',
      label: 'evidenceLevels.low',
      description: 'evidenceLevels.desc.low',
      color: '#f97316',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      recommendationStrength: 'evidenceLevels.strength.weak',
    };
  } else {
    return {
      level: 'evidenceLevels.veryLow',
      label: 'evidenceLevels.veryLow',
      description: 'evidenceLevels.desc.veryLow',
      color: '#9ca3af',
      backgroundColor: 'rgba(156, 163, 175, 0.1)',
      recommendationStrength: 'evidenceLevels.strength.veryWeak',
    };
  }
};

// Definitions for ScientificScoreIndex
export const EvidenceLevels = {
  muitoAlta: { label: 'evidenceLevels.veryHigh', color: '#15803d', range: [4.5, 5.0] },
  alta: { label: 'evidenceLevels.high', color: '#16a34a', range: [4.0, 4.4] },
  mediaAlta: { label: 'evidenceLevels.mediumHigh', color: '#2563eb', range: [3.5, 3.9] },
  media: { label: 'evidenceLevels.medium', color: '#3b82f6', range: [3.0, 3.4] },
  mediaBaixa: { label: 'evidenceLevels.mediumLow', color: '#f59e0b', range: [2.0, 2.9] },
  baixa: { label: 'evidenceLevels.low', color: '#f97316', range: [1.0, 1.9] },
  muitoBaixa: { label: 'evidenceLevels.veryLow', color: '#9ca3af', range: [0, 0.9] },
};

export const getEfficacyColor = (efficacyScore: number): string => {
  if (efficacyScore >= 80) return '#15803d';
  if (efficacyScore >= 60) return '#2563eb';
  if (efficacyScore >= 40) return '#f59e0b';
  return '#9ca3af';
};

export const convertTo5Scale = (score: number): number => {
  return (score / 100) * 5;
};

export const convertTo100Scale = (score: number): number => {
  return (score / 5) * 100;
};
