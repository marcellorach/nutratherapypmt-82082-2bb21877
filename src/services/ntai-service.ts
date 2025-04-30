
import { NtaiAnalysisResult } from '@/types/ntai';
import { processStudyWithAI } from './ntai/processing';
import { 
  extractNutraceuticalsFromStudy, 
  extractConditionsFromStudy,
  extractInteractionsFromStudy,
  extractSideEffectsFromStudy,
  simulateAnalysisResult 
} from './ntai/simulation';
import { scoreStudyQuality, scoreStudyRelevance } from './ntai/scoring';
import { supabase } from '@/integrations/supabase/client';

export const analyzeStudy = async (
  studyId: string, 
  studyText: string,
  nutraceuticalsPrompt?: string,
  conditionsPrompt?: string
): Promise<NtaiAnalysisResult> => {
  console.log('Analisando estudo com prompts personalizados:');
  console.log('Prompt para nutracêuticos:', nutraceuticalsPrompt);
  console.log('Prompt para condições:', conditionsPrompt);
  
  try {
    // Tenta processar o estudo com a Edge Function
    const result = await processStudyWithAI(studyId, studyText, nutraceuticalsPrompt, conditionsPrompt);
    return result;
  } catch (error) {
    console.log('Erro ao usar Edge Function, usando modo de simulação:', error);
    
    // Gera resultados simulados para testes em caso de falha
    const simulatedResult = await simulateAnalysisResult(studyId, studyText);
    
    try {
      const jsonAnalysisData = JSON.parse(JSON.stringify(simulatedResult));
      
      // Gerar um título para o estudo
      const studyTitle = `Análise Simulada: ${studyText.substring(0, 30) || studyId}`;
      
      // Insere os dados simulados no banco
      const { error: insertError } = await supabase
        .from('processed_studies')
        .insert({
          study_id: studyId,
          analysis_data: jsonAnalysisData,
          kanban_status: 'new',
          processed_by: 'ntai',
          title: studyTitle,
          description: 'Análise gerada via processamento NTAI simulado',
          journal: 'Processamento NTAI'
        });
        
      if (insertError) {
        console.error('Erro ao salvar análise simulada:', insertError);
      }
    } catch (insertError) {
      console.error('Erro ao inserir no banco de dados:', insertError);
    }
    
    return simulatedResult;
  }
};

export default {
  analyzeStudy,
  processStudyWithAI,
  extractNutraceuticalsFromStudy,
  extractConditionsFromStudy,
  extractInteractionsFromStudy,
  extractSideEffectsFromStudy,
  scoreStudyQuality,
  scoreStudyRelevance
};
