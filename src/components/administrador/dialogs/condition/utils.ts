export const getEfficacyColor = (score: number) => {
  if (score >= 4) return "text-green-600 bg-green-50 border-green-200";
  if (score >= 3) return "text-amber-600 bg-amber-50 border-amber-200"; 
  if (score >= 2) return "text-blue-600 bg-blue-50 border-blue-200";  // Cor para nível 'Leve'
  if (score >= 1) return "text-orange-600 bg-orange-50 border-orange-200";
  return "text-red-600 bg-red-50 border-red-200";
};

export const getConditionTypeTitle = (type: 'prevention' | 'treatment' | 'support' | null) => {
  switch(type) {
    case 'prevention': return 'Prevenção';
    case 'treatment': return 'Tratamento';
    case 'support': return 'Suporte';
    default: return '';
  }
};

export const generateEfficacyOverTimeData = (efficacyScore: number) => [
  { month: 'Mês 1', eficácia: Math.min(5, Math.max(1, efficacyScore * 0.7)).toFixed(1) },
  { month: 'Mês 2', eficácia: Math.min(5, Math.max(1, efficacyScore * 0.85)).toFixed(1) },
  { month: 'Mês 3', eficácia: Math.min(5, Math.max(1, efficacyScore * 0.95)).toFixed(1) },
  { month: 'Mês 4', eficácia: efficacyScore.toFixed(1) },
  { month: 'Mês 5', eficácia: Math.min(5, Math.max(1, efficacyScore * 1.05)).toFixed(1) },
  { month: 'Mês 6', eficácia: Math.min(5, Math.max(1, efficacyScore * 1.1)).toFixed(1) },
];

export const generateComparativeEfficacyData = (efficacyScore: number, nutraceuticalName: string) => [
  { 
    categoria: 'Filhotes', 
    [nutraceuticalName]: Math.min(5, Math.max(1, efficacyScore * 0.9)).toFixed(1), 
    'Média outras opções': '2.8' 
  },
  { 
    categoria: 'Adultos', 
    [nutraceuticalName]: efficacyScore.toFixed(1), 
    'Média outras opções': '3.2' 
  },
  { 
    categoria: 'Sênior', 
    [nutraceuticalName]: Math.min(5, Math.max(1, efficacyScore * 1.1)).toFixed(1), 
    'Média outras opções': '2.9' 
  },
];
