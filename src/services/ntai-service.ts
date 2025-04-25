
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
    const result = await processStudyWithAI(studyId, studyText, nutraceuticalsPrompt, conditionsPrompt);
    
    const jsonAnalysisData = JSON.parse(JSON.stringify(result));
    
    // Gerar um título para o estudo se ele não existir
    const studyTitle = `Análise de Estudo ${studyId.substring(0, 8)}`;
    
    const { data: savedAnalysis, error: insertError } = await supabase
      .from('processed_studies')
      .insert({
        study_id: studyId,
        analysis_data: jsonAnalysisData,
        kanban_status: 'new',
        processed_by: 'ntai',
        title: studyTitle,
        description: 'Análise gerada via processamento NTAI',
        journal: 'Processamento NTAI'
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Erro ao salvar análise: ${insertError.message}`);
    }

    return result;
  } catch (error) {
    console.log('Erro ao usar Edge Function, usando modo de simulação:', error);
    
    const [
      extractedNutraceuticals,
      extractedConditions,
      extractedInteractions,
      extractedSideEffects,
      qualityScore,
      relevanceScore
    ] = await Promise.all([
      extractNutraceuticalsFromStudy(studyText, nutraceuticalsPrompt),
      extractConditionsFromStudy(studyText, conditionsPrompt),
      extractInteractionsFromStudy(studyText),
      extractSideEffectsFromStudy(studyText),
      scoreStudyQuality(studyText),
      scoreStudyRelevance(studyText)
    ]);
    
    const result = {
      studyId,
      extractedNutraceuticals,
      extractedConditions,
      extractedInteractions,
      extractedSideEffects,
      qualityScore,
      relevanceScore
    };
    
    try {
      const jsonAnalysisData = JSON.parse(JSON.stringify(result));
      
      // Gerar um título para o estudo se ele não existir
      const studyTitle = `Análise de Estudo ${studyId.substring(0, 8)}`;
      
      const { error: insertError } = await supabase
        .from('processed_studies')
        .insert({
          study_id: studyId,
          analysis_data: jsonAnalysisData,
          kanban_status: 'new',
          processed_by: 'ntai',
          title: studyTitle,
          description: 'Análise gerada via processamento NTAI',
          journal: 'Processamento NTAI'
        });
        
      if (insertError) {
        console.error('Erro ao salvar análise:', insertError);
      }
    } catch (insertError) {
      console.error('Erro ao inserir no banco de dados:', insertError);
    }
    
    return result;
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
