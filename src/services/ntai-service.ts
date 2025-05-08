
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
    // Tenta processar o estudo com a Edge Function
    const result = await processStudyWithAI(studyId, studyText, nutraceuticalsPrompt, conditionsPrompt);
    
    // Verificar se a análise foi bem-sucedida antes de salvar no banco
    try {
      const jsonAnalysisData = JSON.parse(JSON.stringify(result));
      
      // Atualizar o estudo no banco com os resultados da análise
      const { data: studyData, error: studyError } = await supabase
        .from('processed_studies')
        .select('*')
        .eq('id', studyId)
        .maybeSingle();
        
      if (studyError) {
        console.error('Erro ao buscar estudo:', studyError);
      } else if (studyData) {
        // Atualizar o estudo com os dados da análise
        const { error: updateError } = await supabase
          .from('processed_studies')
          .update({
            analysis_data: jsonAnalysisData,
            kanban_status: 'processed'
          })
          .eq('id', studyId);
          
        if (updateError) {
          console.error('Erro ao atualizar estudo com análise:', updateError);
        }
        
        // Processar nutracêuticos encontrados
        if (result.extractedNutraceuticals && result.extractedNutraceuticals.length > 0) {
          for (const nutra of result.extractedNutraceuticals) {
            // Verificar se o nutracêutico já existe
            const { data: existingNutra, error: nutraQueryError } = await supabase
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
                  description: `Encontrado em análise de estudo: ${studyData.title || studyId}`,
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
                study_id: studyId,
                relevance_score: nutra.confidence || 4.0
              }]);
              
            if (relateError) {
              console.error('Erro ao associar nutracêutico ao estudo:', relateError);
            }
          }
        }
      }
    } catch (dbError) {
      console.error('Erro ao processar resultado para o banco:', dbError);
    }
    
    return result;
  } catch (error: any) {
    console.log('Erro ao usar Edge Function, usando modo de simulação:', error);
    
    // Gera resultados simulados para testes em caso de falha
    const simulatedResult = await simulateAnalysisResult(studyId, studyText);
    
    try {
      // Só tentamos inserir no banco se o ID do estudo for um UUID válido
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studyId)) {
        const jsonAnalysisData = JSON.parse(JSON.stringify(simulatedResult));
        
        // Gerar um título para o estudo
        const studyTitle = `Análise Simulada: ${studyText.substring(0, 30) || studyId}`;
        
        // Obter dados do estudo existente
        const { data: existingStudy } = await supabase
          .from('processed_studies')
          .select('*')
          .eq('id', studyId)
          .maybeSingle();
        
        if (existingStudy) {
          // Atualizar o estudo existente
          const { error: updateError } = await supabase
            .from('processed_studies')
            .update({
              analysis_data: jsonAnalysisData,
              kanban_status: 'processed',
            })
            .eq('id', studyId);
            
          if (updateError) {
            console.error('Erro ao atualizar análise:', updateError);
            throw new Error(`Erro ao atualizar análise: ${updateError.message}`);
          }
        } else {
          // Inserir novo estudo caso não exista
          const { error: insertError } = await supabase
            .from('processed_studies')
            .insert({
              study_id: studyId,
              id: studyId, // Usar o mesmo ID
              analysis_data: jsonAnalysisData,
              kanban_status: 'processed',
              processed_by: 'ntai',
              title: studyTitle,
              description: 'Análise gerada via processamento NTAI simulado',
              journal: 'Processamento NTAI'
            });
            
          if (insertError) {
            console.error('Erro ao salvar análise simulada:', insertError);
            throw new Error(`Erro ao salvar análise simulada: ${insertError.message}`);
          }
        }
      } else {
        console.warn('ID de estudo inválido para inserção no banco:', studyId);
        // Ainda retornamos o resultado simulado, mas avisamos sobre o ID inválido
      }
    } catch (insertError: any) {
      console.error('Erro ao inserir no banco de dados:', insertError);
      throw new Error(`Erro ao salvar no banco de dados: ${insertError.message}`);
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
