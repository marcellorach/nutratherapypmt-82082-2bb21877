
import { useState, useEffect } from 'react';
import { VetGraphRAGAnalysisResult } from '@/types/vetgraphrag';
import { supabase } from '@/integrations/supabase/client';

// Type alias for backward compatibility
type NtaiAnalysisResult = VetGraphRAGAnalysisResult;
import { useToast } from '@/hooks/use-toast';

export const useAnalysisResults = () => {
  const [analysisResult, setAnalysisResult] = useState<NtaiAnalysisResult | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const { toast } = useToast();

  const clearAnalysisResult = () => {
    setAnalysisResult(null);
    setImportSuccess(false);
  };

  // Função para importar resultados para o banco de dados
  const importResultsToDatabase = async (results: any) => {
    if (!results) return;
    
    setIsImporting(true);
    try {
      console.log('Iniciando importação para o banco de dados:', results);
      
      // Processar nutracêuticos
      if (results.nutraceuticals && results.nutraceuticals.length > 0) {
        for (const nutra of results.nutraceuticals) {
          // Inserir na tabela de nutracêuticos
          const { data: nutraData, error: nutraError } = await supabase
            .from('nutraceuticals')
            .insert([{
              name: nutra.name,
              description: nutra.description,
              chemical_compound: nutra.chemical_compound || null,
              source: nutra.source || "Planilha importada",
              dosage: nutra.dosage || null
            }])
            .select()
            .single();
            
          if (nutraError) {
            console.error('Erro ao inserir nutracêutico:', nutraError);
            continue;
          }
          
          console.log('Nutracêutico inserido:', nutraData);
          
          // Processar condições relacionadas
          if (nutra.conditions && nutra.conditions.length > 0) {
            for (const condition of nutra.conditions) {
              // Verificar se a condição já existe ou criar nova
              const { data: existingCondition, error: conditionQueryError } = await supabase
                .from('health_conditions')
                .select('*')
                .eq('name', condition.name)
                .maybeSingle();
                
              let conditionId;
              
              if (!existingCondition) {
                // Criar nova condição
                const { data: newCondition, error: condCreateError } = await supabase
                  .from('health_conditions')
                  .insert([{
                    name: condition.name,
                    description: condition.description || `Condição relacionada a ${nutra.name}`
                  }])
                  .select()
                  .single();
                  
                if (condCreateError) {
                  console.error('Erro ao criar condição de saúde:', condCreateError);
                  continue;
                }
                
                conditionId = newCondition.id;
              } else {
                conditionId = existingCondition.id;
              }
              
              // Criar relacionamento entre nutracêutico e condição
              await supabase
                .from('nutraceutical_conditions')
                .insert([{
                  nutraceutical_id: nutraData.id,
                  condition_id: conditionId,
                  relationship_type: condition.relationship_type || 'treatment',
                  efficacy_score: condition.efficacy_score || 3.0
                }]);
            }
          }
        }
      }
      
      // Processar arquivos de estudos se existirem
      if (results.studyFiles && results.studyFiles.length > 0) {
        for (const studyFile of results.studyFiles) {
          // Registrar na tabela de estudos científicos
          const { data: study, error: studyError } = await supabase
            .from('scientific_studies')
            .insert([{
              title: studyFile.name.replace('.pdf', ''),
              link: studyFile.url,
              year: new Date().getFullYear(),
              journal: 'Arquivo importado',
              abstract: `Estudo importado: ${studyFile.name}`
            }])
            .select()
            .single();
            
          if (studyError) {
            console.error('Erro ao inserir estudo científico:', studyError);
            continue;
          }
          
          // Se o arquivo tem um nutraceutical_id associado, criar relação
          if (studyFile.nutraceuticalId) {
            await supabase
              .from('nutraceutical_studies')
              .insert([{
                nutraceutical_id: studyFile.nutraceuticalId,
                study_id: study.id,
                relevance_score: 4.0
              }]);
          }
        }
      }
      
      setImportSuccess(true);
      toast({
        title: "Importação concluída",
        description: `${results.nutraceuticalsCount} nutracêuticos e ${results.studyFiles?.length || 0} estudos foram importados com sucesso.`,
      });
      
      // Disparar evento para atualizar a lista de nutracêuticos
      window.dispatchEvent(new CustomEvent('nutraceuticals-imported'));
      
    } catch (error: any) {
      console.error('Erro durante importação:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro durante a importação dos dados.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return {
    analysisResult,
    setAnalysisResult,
    clearAnalysisResult,
    importResultsToDatabase,
    isImporting,
    importSuccess
  };
};
