
import { ExamResult } from "@/types";
import { supabase } from "@/integrations/supabase/client";

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

// Cache for lab reference ranges fetched from DB
let cachedReferenceRanges: Record<string, { min: number; max: number; unit: string; significance: string | null }> | null = null;

/**
 * Fetch lab reference ranges from the database.
 * Falls back to basic defaults if DB query fails.
 */
const fetchReferenceRanges = async (species: string = 'canine'): Promise<Record<string, { min: number; max: number; unit: string; significance: string | null }>> => {
  if (cachedReferenceRanges) return cachedReferenceRanges;

  try {
    const { data, error } = await supabase
      .from('lab_reference_ranges')
      .select('test_name, min_normal, max_normal, unit, clinical_significance')
      .eq('species', species);

    if (error || !data || data.length === 0) {
      console.warn('Could not fetch lab_reference_ranges from DB, using minimal fallback');
      return {};
    }

    const ranges: Record<string, { min: number; max: number; unit: string; significance: string | null }> = {};
    for (const row of data) {
      const key = row.test_name.toLowerCase().replace(/ /g, '_');
      ranges[key] = {
        min: row.min_normal ?? 0,
        max: row.max_normal ?? 999,
        unit: row.unit || '',
        significance: row.clinical_significance || null,
      };
    }

    cachedReferenceRanges = ranges;
    return ranges;
  } catch (err) {
    console.error('Error fetching reference ranges:', err);
    return {};
  }
};

/**
 * Invalidate cached reference ranges (e.g. after admin updates them).
 */
export const clearReferenceRangesCache = () => {
  cachedReferenceRanges = null;
};

// Função para analisar tendências entre exames
const analyzeTrend = (currentValue: number, previousValues: number[]): 'increasing' | 'decreasing' | 'stable' => {
  if (previousValues.length === 0) return 'stable';
  const avgPrevious = previousValues.reduce((sum, val) => sum + val, 0) / previousValues.length;
  const percentChange = ((currentValue - avgPrevious) / avgPrevious) * 100;
  if (percentChange > 10) return 'increasing';
  if (percentChange < -10) return 'decreasing';
  return 'stable';
};

// Função para gerar recomendações baseadas nos exames
const generateRecommendations = (enhancedResults: Record<string, EnhancedExamValue>): string[] => {
  const recommendations: string[] = [];
  
  for (const [key, result] of Object.entries(enhancedResults)) {
    if (result.status === 'low') {
      recommendations.push(`Valor baixo de ${key} detectado. Considerar avaliação adicional e possível suplementação.`);
    } else if (result.status === 'high') {
      recommendations.push(`Valor elevado de ${key} detectado. Monitorar durante o tratamento.`);
    } else if (result.status === 'critical-low' || result.status === 'critical-high') {
      recommendations.push(`⚠️ Valor crítico de ${key}. Requer atenção veterinária imediata.`);
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Manter monitoramento regular dos parâmetros laboratoriais durante o tratamento.');
    recommendations.push('Repetir exames em 3 meses para avaliar resposta à terapia nutracêutica.');
  }
  
  return recommendations;
};

// Função principal para enriquecer os dados dos exames
export const enhanceExams = async (exams: ExamResult[], condition: string, species: string = 'canine'): Promise<EnhancedExam[]> => {
  const referenceValues = await fetchReferenceRanges(species);
  
  // Ordenar exames por data
  const sortedExams = [...exams].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  return sortedExams.map((exam, index) => {
    const enhancedResults: Record<string, EnhancedExamValue> = {};
    
    for (const [key, rawValue] of Object.entries(exam.results)) {
      const refKey = key.toLowerCase().replace(/ /g, '_');
      const ref = referenceValues[refKey];
      
      let value: number;
      let unit: string;
      
      if (typeof rawValue === 'number') {
        value = rawValue;
        unit = ref?.unit || '';
      } else {
        const match = String(rawValue).match(/(\d+\.?\d*)/);
        value = match ? parseFloat(match[1]) : 0;
        const unitMatch = String(rawValue).match(/[0-9.]+\s*([a-zA-Z/%μ]+)/);
        unit = unitMatch ? unitMatch[1] : (ref?.unit || '');
      }
      
      let status: 'normal' | 'high' | 'low' | 'critical-high' | 'critical-low' = 'normal';
      let percentFromReference: number | undefined;
      
      if (ref) {
        const avg = (ref.min + ref.max) / 2;
        percentFromReference = avg > 0 ? ((value - avg) / avg) * 100 : undefined;
        
        if (value < ref.min) {
          status = value < ref.min * 0.7 ? 'critical-low' : 'low';
        } else if (value > ref.max) {
          status = value > ref.max * 1.3 ? 'critical-high' : 'high';
        }
      }
      
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
    
    // Gerar interpretação usando clinical_significance do banco quando disponível
    let interpretation = 'Análise dos resultados:\n';
    
    for (const [key, result] of Object.entries(enhancedResults)) {
      if (result.status !== 'normal') {
        const refKey = key.toLowerCase().replace(/ /g, '_');
        const significance = referenceValues[refKey]?.significance;
        if (significance) {
          interpretation += `- ${key}: ${significance}\n`;
        } else {
          interpretation += `- ${key}: Valor ${result.status === 'high' || result.status === 'critical-high' ? 'elevado' : 'baixo'}. Monitorar.\n`;
        }
      }
    }
    
    if (interpretation === 'Análise dos resultados:\n') {
      interpretation += '- Todos os parâmetros estão dentro das faixas de referência para a espécie e idade.';
    }
    
    const recommendations = generateRecommendations(enhancedResults);
    
    return {
      ...exam,
      enhancedResults,
      interpretation,
      recommendations
    };
  });
};

/**
 * Synchronous wrapper for backward compatibility.
 * Returns exams with empty enhanced data while async fetch completes.
 */
export const enhanceExamsSync = (exams: ExamResult[], condition: string): EnhancedExam[] => {
  // Return basic structure synchronously; caller should migrate to async version
  return exams.map(exam => ({
    ...exam,
    enhancedResults: {},
    interpretation: 'Carregando dados de referência...',
    recommendations: []
  }));
};
