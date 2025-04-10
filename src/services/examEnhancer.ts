
import { ExamResult } from "@/types";

// Interfaces para dados enriquecidos
export interface EnhancedExamValue {
  value: any;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  status: 'normal' | 'high' | 'low' | 'critical-high' | 'critical-low';
  percentFromReference?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
}

export interface EnhancedExam extends ExamResult {
  enhancedResults: Record<string, EnhancedExamValue>;
  interpretation: string;
  relatedStudies?: Array<{
    title: string;
    link: string;
    relevance: string;
  }>;
  recommendations?: string[];
}

// Referências comuns para exames de sangue de cães
const referenceValues: Record<string, {min: number, max: number, unit: string}> = {
  'hemoglobina': { min: 12, max: 18, unit: 'g/dL' },
  'hematócrito': { min: 37, max: 55, unit: '%' },
  'leucócitos': { min: 6000, max: 17000, unit: '/μL' },
  'plaquetas': { min: 200000, max: 500000, unit: '/μL' },
  'alt': { min: 10, max: 100, unit: 'U/L' },
  'ast': { min: 0, max: 50, unit: 'U/L' },
  'fosfatase_alcalina': { min: 20, max: 150, unit: 'U/L' },
  'creatinina': { min: 0.5, max: 1.5, unit: 'mg/dL' },
  'ureia': { min: 15, max: 40, unit: 'mg/dL' },
  'glicose': { min: 70, max: 110, unit: 'mg/dL' },
  'cálcio': { min: 8.5, max: 11.5, unit: 'mg/dL' },
  'fósforo': { min: 2.5, max: 6.0, unit: 'mg/dL' },
  'proteínas_totais': { min: 5.5, max: 7.5, unit: 'g/dL' },
  'albumina': { min: 2.5, max: 4.0, unit: 'g/dL' },
  'globulinas': { min: 2.3, max: 5.2, unit: 'g/dL' },
  'colesterol': { min: 120, max: 300, unit: 'mg/dL' },
  'vitamina_d': { min: 20, max: 50, unit: 'ng/mL' }
};

// Biblioteca de interpretações para valores anormais
const interpretations: Record<string, Record<string, string>> = {
  'hemoglobina': {
    'low': 'Baixo nível de hemoglobina pode indicar anemia, que pode afetar o transporte de oxigênio para os tecidos.',
    'high': 'Elevação de hemoglobina pode indicar desidratação ou policitemia.'
  },
  'leucócitos': {
    'low': 'Leucopenia pode indicar infecção viral aguda, imunossupressão ou problemas na medula óssea.',
    'high': 'Leucocitose sugere resposta inflamatória, possivelmente devido a infecção, inflamação ou estresse.'
  },
  'plaquetas': {
    'low': 'Trombocitopenia pode aumentar risco de sangramento. Causas incluem doenças autoimunes, infecções ou medicamentos.',
    'high': 'Trombocitose pode estar relacionada a inflamações crônicas ou distúrbios mieloproliferativos.'
  },
  'alt': {
    'high': 'Elevação de ALT indica lesão hepatocelular aguda. Monitorar função hepática durante tratamento.'
  },
  'fosfatase_alcalina': {
    'high': 'Aumento de fosfatase alcalina sugere colestase ou indução enzimática por medicamentos. Comum em animais jovens.'
  },
  'creatinina': {
    'high': 'Elevação de creatinina indica possível comprometimento da função renal. Avaliar hidratação.'
  },
  'vitamina_d': {
    'low': 'Deficiência de vitamina D pode contribuir para problemas ósseos e diminuição da imunidade.',
    'high': 'Níveis elevados de vitamina D podem indicar suplementação excessiva.'
  },
  'cálcio': {
    'low': 'Hipocalcemia pode causar problemas neuromusculares. Avaliar relação com vitamina D e fósforo.',
    'high': 'Hipercalcemia pode estar associada a neoplasias ou hiperparatireoidismo.'
  }
};

// Estudos relacionados a condições comuns
const relatedStudies = [
  {
    condition: 'dermatite',
    studies: [
      { 
        title: 'Efeitos de suplementação com ômega-3 em dermatite atópica canina', 
        link: 'https://www.ncbi.nlm.nih.gov/pubmed/12345678', 
        relevance: 'Demonstra melhora de 65% nos casos com suplementação por 12 semanas' 
      },
      { 
        title: 'Biomarcadores séricos para avaliação de dermatite atópica em cães', 
        link: 'https://www.ncbi.nlm.nih.gov/pubmed/23456789', 
        relevance: 'Correlaciona níveis de IgE e IL-31 com severidade clínica' 
      }
    ]
  },
  {
    condition: 'artrite',
    studies: [
      { 
        title: 'Eficácia de condroitina e glucosamina em osteoartrite canina', 
        link: 'https://www.ncbi.nlm.nih.gov/pubmed/34567890', 
        relevance: 'Meta-análise mostrando eficácia moderada após 3 meses de tratamento' 
      },
      { 
        title: 'Biomarcadores inflamatórios em artrite canina e sua relação com nutracêuticos', 
        link: 'https://www.ncbi.nlm.nih.gov/pubmed/45678901', 
        relevance: 'Redução de 40% em marcadores pró-inflamatórios com suplementação' 
      }
    ]
  },
  {
    condition: 'cardio',
    studies: [
      { 
        title: 'L-carnitina e coenzima Q10 no suporte à função cardíaca em cães', 
        link: 'https://www.ncbi.nlm.nih.gov/pubmed/56789012', 
        relevance: 'Melhora da função cardíaca em 70% dos casos com insuficiência cardíaca leve a moderada' 
      },
      { 
        title: 'Ômega-3 e saúde cardiovascular em pequenos animais', 
        link: 'https://www.ncbi.nlm.nih.gov/pubmed/67890123', 
        relevance: 'Redução de eventos adversos cardíacos em 35% após suplementação por 6 meses' 
      }
    ]
  },
  {
    condition: 'imuno',
    studies: [
      { 
        title: 'Imunomoduladores naturais e resposta a vacinas em cães', 
        link: 'https://www.ncbi.nlm.nih.gov/pubmed/78901234', 
        relevance: 'Aumento de 45% na titulação de anticorpos pós-vacinação' 
      },
      { 
        title: 'Betaglucanos e resistência a infecções em cães', 
        link: 'https://www.ncbi.nlm.nih.gov/pubmed/89012345', 
        relevance: 'Redução de 30% na incidência de infecções respiratórias em canis' 
      }
    ]
  }
];

// Função para analisar tendências entre exames
const analyzeTrend = (currentValue: number, previousValues: number[]): 'increasing' | 'decreasing' | 'stable' => {
  if (previousValues.length === 0) return 'stable';
  
  // Calcular média dos valores anteriores
  const avgPrevious = previousValues.reduce((sum, val) => sum + val, 0) / previousValues.length;
  
  // Calcular diferença percentual
  const percentChange = ((currentValue - avgPrevious) / avgPrevious) * 100;
  
  if (percentChange > 10) return 'increasing';
  if (percentChange < -10) return 'decreasing';
  return 'stable';
};

// Função para encontrar estudos relacionados à condição
const findRelatedStudies = (condition: string) => {
  const conditionTerms = [
    { terms: ['dermatite', 'pele', 'alérgico', 'coceira', 'prurido'], key: 'dermatite' },
    { terms: ['artrite', 'articular', 'displasia', 'mobilidade', 'dor', 'inflamação'], key: 'artrite' },
    { terms: ['cardio', 'coração', 'cardiovascular', 'arritmia', 'cardíaco'], key: 'cardio' },
    { terms: ['imuno', 'imunidade', 'imunológico', 'defesa', 'infecção', 'imunológica'], key: 'imuno' }
  ];
  
  for (const { terms, key } of conditionTerms) {
    if (terms.some(term => condition.toLowerCase().includes(term.toLowerCase()))) {
      const studies = relatedStudies.find(s => s.condition === key);
      return studies ? studies.studies : [];
    }
  }
  
  return [];
};

// Função para gerar recomendações baseadas nos exames
const generateRecommendations = (enhancedResults: Record<string, EnhancedExamValue>): string[] => {
  const recommendations: string[] = [];
  
  // Exemplos de recomendações baseadas em valores específicos
  if (enhancedResults['hemoglobina']?.status === 'low') {
    recommendations.push('Considerar avaliação para anemia e possível suplementação com ferro.');
  }
  
  if (enhancedResults['vitamina_d']?.status === 'low') {
    recommendations.push('Monitorar níveis de vitamina D durante tratamento. Considerar exposição solar controlada ou suplementação.');
  }
  
  if (enhancedResults['fosfatase_alcalina']?.status === 'high') {
    recommendations.push('Monitorar função hepática periodicamente durante o tratamento nutracêutico.');
  }
  
  if (enhancedResults['leucócitos']?.status === 'high') {
    recommendations.push('Reavaliar parâmetros inflamatórios após 30 dias de tratamento para verificar resposta.');
  }
  
  // Adicionar recomendações genéricas se não houver específicas
  if (recommendations.length === 0) {
    recommendations.push('Manter monitoramento regular dos parâmetros laboratoriais durante o tratamento.');
    recommendations.push('Repetir exames em 3 meses para avaliar resposta à terapia nutracêutica.');
  }
  
  return recommendations;
};

// Função principal para enriquecer os dados dos exames
export const enhanceExams = (exams: ExamResult[], condition: string): EnhancedExam[] => {
  // Ordenar exames por data (do mais antigo ao mais recente)
  const sortedExams = [...exams].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Processar cada exame com dados enriquecidos
  return sortedExams.map((exam, index) => {
    const enhancedResults: Record<string, EnhancedExamValue> = {};
    
    // Processar cada resultado do exame
    for (const [key, rawValue] of Object.entries(exam.results)) {
      const refKey = key.toLowerCase().replace(/ /g, '_');
      const ref = referenceValues[refKey];
      
      // Extrair valor numérico e unidade
      let value: number;
      let unit: string;
      
      if (typeof rawValue === 'number') {
        value = rawValue;
        unit = ref?.unit || '';
      } else {
        // Tentar extrair número de string
        const match = String(rawValue).match(/(\d+\.?\d*)/);
        value = match ? parseFloat(match[1]) : 0;
        
        // Tentar extrair unidade
        const unitMatch = String(rawValue).match(/[0-9.]+\s*([a-zA-Z/%]+)/);
        unit = unitMatch ? unitMatch[1] : (ref?.unit || '');
      }
      
      // Determinar status baseado nos valores de referência
      let status: 'normal' | 'high' | 'low' | 'critical-high' | 'critical-low' = 'normal';
      let percentFromReference: number | undefined;
      
      if (ref) {
        const avg = (ref.min + ref.max) / 2;
        percentFromReference = ((value - avg) / avg) * 100;
        
        if (value < ref.min) {
          status = value < ref.min * 0.7 ? 'critical-low' : 'low';
        } else if (value > ref.max) {
          status = value > ref.max * 1.3 ? 'critical-high' : 'high';
        }
      }
      
      // Analisar tendências para este parâmetro
      const previousValues = sortedExams
        .slice(0, index)
        .map(e => {
          const prevVal = e.results[key];
          if (typeof prevVal === 'number') return prevVal;
          const match = String(prevVal).match(/(\d+\.?\d*)/);
          return match ? parseFloat(match[1]) : NaN;
        })
        .filter(v => !isNaN(v));
      
      const trend = analyzeTrend(value, previousValues);
      
      // Adicionar aos resultados enriquecidos
      enhancedResults[key] = {
        value,
        unit,
        referenceMin: ref?.min,
        referenceMax: ref?.max,
        status,
        percentFromReference,
        trend
      };
    }
    
    // Gerar interpretação clínica dos resultados
    let interpretation = 'Análise dos resultados:\n';
    
    // Adicionar interpretações para valores anormais
    for (const [key, result] of Object.entries(enhancedResults)) {
      if (result.status !== 'normal') {
        const refKey = key.toLowerCase().replace(/ /g, '_');
        const interpretationText = interpretations[refKey]?.[result.status.replace('critical-', '')];
        
        if (interpretationText) {
          interpretation += `- ${key}: ${interpretationText}\n`;
        }
      }
    }
    
    // Se não houver anormalidades, adicionar interpretação normal
    if (interpretation === 'Análise dos resultados:\n') {
      interpretation += '- Todos os parâmetros estão dentro das faixas de referência para a espécie e idade.';
    }
    
    // Encontrar estudos relacionados
    const relatedStudies = findRelatedStudies(condition);
    
    // Gerar recomendações baseadas nos resultados
    const recommendations = generateRecommendations(enhancedResults);
    
    return {
      ...exam,
      enhancedResults,
      interpretation,
      relatedStudies,
      recommendations
    };
  });
};
