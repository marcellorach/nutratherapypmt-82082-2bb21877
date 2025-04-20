
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
