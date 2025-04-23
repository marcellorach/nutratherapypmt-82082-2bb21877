
import { NtaiAnalysisResult } from '@/types/ntai';
import { supabase } from '@/integrations/supabase/client';

export const processStudyWithAI = async (
  studyId: string,
  studyText: string,
  nutraceuticalsPrompt?: string,
  conditionsPrompt?: string
): Promise<NtaiAnalysisResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('process-study', {
      body: {
        studyId,
        studyContent: studyText,
        nutraceuticalsPrompt,
        conditionsPrompt
      }
    });

    if (error) {
      console.error('Erro ao processar estudo com IA:', error);
      throw new Error(`Erro na Edge Function: ${error.message}`);
    }

    if (!data || !data.analysisResult) {
      console.error('Resposta inválida da Edge Function:', data);
      throw new Error('Resposta inválida da Edge Function');
    }

    return data.analysisResult;
  } catch (error) {
    console.error('Erro ao processar estudo com IA:', error);
    throw error;
  }
};
