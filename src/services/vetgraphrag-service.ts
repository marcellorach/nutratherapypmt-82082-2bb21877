
import { VetGraphRAGAnalysisResult } from '@/types/vetgraphrag';
import { processStudyWithAI } from './ntai/processing';
import { scoreStudyQuality, scoreStudyRelevance } from './ntai/scoring';
import { supabase } from '@/integrations/supabase/client';

// Alias for backward compatibility
type NtaiAnalysisResult = VetGraphRAGAnalysisResult;

export const analyzeStudy = async (
  studyId: string, 
  studyText: string,
  nutraceuticalsPrompt?: string,
  conditionsPrompt?: string
): Promise<NtaiAnalysisResult> => {
  console.log('Analisando estudo via edge function process-study:');
  console.log('ID do estudo:', studyId);
  
  try {
    // Validate UUID
    let validStudyId = studyId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(studyId)) {
      console.warn('ID de estudo não é um UUID válido, criando um novo UUID');
      validStudyId = crypto.randomUUID();
    }
    
    // Call the real edge function instead of simulation
    const result = await processStudyWithAI(
      validStudyId, 
      studyText, 
      nutraceuticalsPrompt, 
      conditionsPrompt
    );
    
    return result;
  } catch (error: any) {
    console.error('Erro ao processar estudo:', error);
    throw new Error(`Erro ao processar estudo: ${error.message}`);
  }
};

export default {
  analyzeStudy,
  processStudyWithAI,
  scoreStudyQuality,
  scoreStudyRelevance
};
