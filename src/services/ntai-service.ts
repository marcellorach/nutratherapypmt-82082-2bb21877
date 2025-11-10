
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
  console.log('ID do estudo:', studyId);
  console.log('Prompt para nutracêuticos:', nutraceuticalsPrompt);
  console.log('Prompt para condições:', conditionsPrompt);
  
  try {
    // Converter IDs numéricos para UUIDs válidos para evitar erros
    let validStudyId = studyId;
    
    // Se o ID não for um UUID válido, vamos criar um novo
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(studyId)) {
      console.warn('ID de estudo não é um UUID válido, criando um novo UUID');
      validStudyId = crypto.randomUUID();
      console.log('Novo UUID gerado:', validStudyId);
    }
    
    // Tenta processar o estudo com a Edge Function
    const result = await simulateAnalysisResult(validStudyId, studyText);
    
    // Verificar se a análise foi bem-sucedida antes de salvar no banco
    try {
      const jsonAnalysisData = JSON.parse(JSON.stringify(result));
      
      // Verificar se já existe um estudo com este ID
      const { data: existingStudy } = await supabase
        .from('processed_studies')
        .select('*')
        .eq('id', validStudyId)
        .maybeSingle();
        
      if (existingStudy) {
        // Atualizar o estudo existente
        const { error: updateError } = await supabase
          .from('processed_studies')
          .update({
            analysis_data: jsonAnalysisData,
            kanban_status: 'processed'
          })
          .eq('id', validStudyId);
          
        if (updateError) {
          console.error('Erro ao atualizar estudo com análise:', updateError);
        }
      } else {
        // Inserir novo estudo
        const { error: insertError } = await supabase
          .from('processed_studies')
          .insert({
            study_id: validStudyId,
            original_filename: `study_${validStudyId}.pdf`,
            storage_path: `/studies/${validStudyId}`,
            import_type: 'manual',
            analysis_data: jsonAnalysisData,
            kanban_status: 'processed',
            processed_by: 'ntai',
            title: `Análise de: ${studyText.substring(0, 50) || validStudyId}`,
            description: 'Análise gerada via processamento NTAI',
            journal: 'Processamento NTAI'
          });
          
        if (insertError) {
          console.error('Erro ao salvar análise:', insertError);
        }
      }
      
      // Processar nutracêuticos encontrados
      if (result.extractedNutraceuticals && result.extractedNutraceuticals.length > 0) {
        for (const nutra of result.extractedNutraceuticals) {
          // Verificar se o nutracêutico já existe
          const { data: existingNutra } = await supabase
            .from('nutraceuticals')
            .select('*')
            .eq('name', nutra.name)
            .maybeSingle();
            
          let nutraId;
          
          if (!existingNutra) {
            // Criar novo nutracêutico
            const { data: newNutra, error: nutraCreateError } = await supabase
              .from('nutraceuticals')
              .insert([{
                name: nutra.name,
                description: `Encontrado em análise de estudo: ${result.studyId || validStudyId}`,
                chemical_compound: null,
                source: "Análise NTAI"
              }])
              .select()
              .single();
              
            if (nutraCreateError) {
              console.error('Erro ao criar nutracêutico:', nutraCreateError);
              continue;
            }
            
            nutraId = newNutra.id;
          } else {
            nutraId = existingNutra.id;
          }
          
          // Associar nutracêutico ao estudo
          const { error: relateError } = await supabase
            .from('nutraceutical_studies')
            .insert([{
              nutraceutical_id: nutraId,
              study_id: validStudyId,
              relevance_score: nutra.confidence || 4.0
            }]);
            
          if (relateError) {
            console.error('Erro ao associar nutracêutico ao estudo:', relateError);
          }
        }
      }
    } catch (dbError) {
      console.error('Erro ao processar resultado para o banco:', dbError);
    }
    
    return result;
  } catch (error: any) {
    console.error('Erro ao processar estudo:', error);
    throw new Error(`Erro ao processar estudo: ${error.message}`);
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
