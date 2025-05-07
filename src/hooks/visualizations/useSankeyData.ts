
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SankeyData, SankeyNode, SankeyLink } from '@/components/administrador/visualizations/sankey/types';
import { toast } from 'sonner';

/**
 * Hook para buscar e formatar dados para visualizações de relação
 */
export const useSankeyData = () => {
  const [sankeyData, setSankeyData] = useState<SankeyData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Categorias e suas cores
  const CATEGORY_COLORS = {
    nutraceutico: '#3b82f6', // Azul
    condicao: '#10b981',     // Verde
    study: '#a855f7'         // Roxo (adicionado para estudos)
  };
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("useSankeyData: Iniciando busca de dados");
        
        // Buscar nutracêuticos
        const { data: nutraceuticals, error: nutraError } = await supabase
          .from('nutraceuticals')
          .select('id, name, description')
          .order('name');
          
        if (nutraError) throw nutraError;
        console.log(`useSankeyData: ${nutraceuticals?.length || 0} nutracêuticos encontrados`);
        
        // Buscar condições de saúde
        const { data: conditions, error: condError } = await supabase
          .from('health_conditions')
          .select('id, name, description')
          .order('name');
          
        if (condError) throw condError;
        console.log(`useSankeyData: ${conditions?.length || 0} condições encontradas`);
        
        // Buscar estudos científicos (novidade)
        const { data: studies, error: studiesError } = await supabase
          .from('scientific_studies')
          .select('id, title, abstract, journal, year')
          .order('year', { ascending: false })
          .limit(50); // Limitar para não sobrecarregar a visualização
          
        if (studiesError) throw studiesError;
        console.log(`useSankeyData: ${studies?.length || 0} estudos científicos encontrados`);
        
        // Buscar as relações entre nutracêuticos e condições
        const { data: relations, error: relError } = await supabase
          .from('nutraceutical_conditions')
          .select(`
            id,
            efficacy_score,
            relationship_type,
            notes,
            nutraceutical_id,
            condition_id
          `);
          
        if (relError) throw relError;
        console.log(`useSankeyData: ${relations?.length || 0} relações entre nutracêuticos e condições encontradas`);
        
        // Buscar relações entre nutracêuticos e estudos (novidade)
        const { data: studyRelations, error: studyRelError } = await supabase
          .from('nutraceutical_studies')
          .select(`
            id,
            relevance_score,
            nutraceutical_id,
            study_id
          `);
          
        if (studyRelError) throw studyRelError;
        console.log(`useSankeyData: ${studyRelations?.length || 0} relações entre nutracêuticos e estudos encontradas`);

        // Criar mapa de IDs para índices
        const nutraMap = new Map();
        const conditionMap = new Map();
        const studyMap = new Map();
        
        // Nós - Nutracêuticos
        const nutraNodes: SankeyNode[] = nutraceuticals.map((nutra, index) => {
          nutraMap.set(nutra.id, index);
          return {
            name: nutra.name,
            category: 'nutraceutico',
            type: 'nutraceutico',
            description: nutra.description || `Nutracêutico: ${nutra.name}`,
            color: CATEGORY_COLORS.nutraceutico
          };
        });
        
        // Nós - Condições
        const conditionNodes: SankeyNode[] = conditions.map((cond, index) => {
          const nodeIndex = index + nutraNodes.length;
          conditionMap.set(cond.id, nodeIndex);
          return {
            name: cond.name,
            category: 'condicao',
            type: 'condicao',
            description: cond.description || `Condição: ${cond.name}`,
            color: CATEGORY_COLORS.condicao
          };
        });
        
        // Nós - Estudos (novidade)
        const studyNodes: SankeyNode[] = studies.map((study, index) => {
          const nodeIndex = index + nutraNodes.length + conditionNodes.length;
          studyMap.set(study.id, nodeIndex);
          return {
            name: study.title,
            category: 'study',
            type: 'study',
            description: `${study.abstract?.substring(0, 100)}... (${study.year}, ${study.journal})`,
            color: CATEGORY_COLORS.study,
            metadata: {
              year: study.year,
              journal: study.journal
            }
          };
        });
        
        // Todos os nós
        const nodes = [...nutraNodes, ...conditionNodes, ...studyNodes];
        
        // Verificar se temos nós suficientes
        if (nodes.length < 2) {
          console.log("useSankeyData: Não há nós suficientes para renderizar o diagrama");
          setSankeyData({ nodes: [], links: [] });
          setIsLoading(false);
          return;
        }
        
        console.log(`useSankeyData: Total de ${nodes.length} nós preparados`);
        
        // Links entre nutracêuticos e condições
        const conditionLinks: SankeyLink[] = relations
          .filter(rel => 
            nutraMap.has(rel.nutraceutical_id) && 
            conditionMap.has(rel.condition_id)
          )
          .map(rel => {
            const sourceIndex = nutraMap.get(rel.nutraceutical_id);
            const targetIndex = conditionMap.get(rel.condition_id);
            
            // Verificar se os índices são válidos
            if (sourceIndex === undefined || targetIndex === undefined) {
              console.warn("useSankeyData: Índice inválido para relação", rel);
              return null;
            }
            
            // Determinar cor com base no score de eficácia
            let color;
            const score = rel.efficacy_score;
            
            if (score >= 4) {
              color = 'rgba(16, 185, 129, 0.7)'; // Verde - alta eficácia
            } else if (score >= 3) {
              color = 'rgba(59, 130, 246, 0.7)'; // Azul - média eficácia
            } else if (score >= 2) {
              color = 'rgba(245, 158, 11, 0.7)'; // Amarelo - baixa eficácia
            } else {
              color = 'rgba(156, 163, 175, 0.7)'; // Cinza - muito baixa eficácia
            }
            
            // Determinar texto da eficácia
            let labelText;
            
            if (score >= 4) {
              labelText = 'Alta eficácia';
            } else if (score >= 3) {
              labelText = 'Eficácia moderada';
            } else if (score >= 2) {
              labelText = 'Eficácia baixa';
            } else {
              labelText = 'Eficácia muito baixa';
            }
            
            // Determinar tipo de relação em português para exibição
            let relationText;
            
            switch (rel.relationship_type) {
              case 'prevention':
                relationText = 'Prevenção';
                break;
              case 'treatment':
                relationText = 'Tratamento';
                break;
              case 'support':
                relationText = 'Suporte';
                break;
              default:
                relationText = 'Outro';
            }
            
            // Garantir que o relationshipType seja exatamente um dos tipos esperados no retorno
            const validatedRelationType = ['prevention', 'treatment', 'support'].includes(rel.relationship_type) 
              ? rel.relationship_type as 'prevention' | 'treatment' | 'support'
              : 'support';
            
            // Aumentar o valor para melhor visualização
            // Valores muito pequenos podem não ser visíveis no diagrama
            const enhancedValue = Math.max(rel.efficacy_score * 20, 10);
            
            return {
              source: sourceIndex,
              target: targetIndex,
              value: enhancedValue, // Escala para visualização
              color,
              labelText,
              description: rel.notes || `${relationText}: Eficácia ${rel.efficacy_score}/5`,
              relationshipType: validatedRelationType,
              originalRelation: rel
            };
          })
          .filter(Boolean) as SankeyLink[];
          
        // Links entre nutracêuticos e estudos (novidade)
        const studyLinks: SankeyLink[] = studyRelations
          .filter(rel => 
            nutraMap.has(rel.nutraceutical_id) && 
            studyMap.has(rel.study_id)
          )
          .map(rel => {
            const sourceIndex = nutraMap.get(rel.nutraceutical_id);
            const targetIndex = studyMap.get(rel.study_id);
            
            // Verificar se os índices são válidos
            if (sourceIndex === undefined || targetIndex === undefined) {
              console.warn("useSankeyData: Índice inválido para relação de estudo", rel);
              return null;
            }
            
            // Determinar cor para estudos
            const color = 'rgba(168, 85, 247, 0.6)'; // Roxo para estudos
            
            // Aumentar o valor para melhor visualização
            const enhancedValue = Math.max(rel.relevance_score * 15, 8);
            
            return {
              source: sourceIndex,
              target: targetIndex,
              value: enhancedValue,
              color,
              labelText: 'Estudo relacionado',
              description: `Relevância: ${rel.relevance_score}/5`,
              relationshipType: 'study',
              originalRelation: rel
            };
          })
          .filter(Boolean) as SankeyLink[];
          
        // Combinar todos os links
        const links = [...conditionLinks, ...studyLinks];
        
        console.log(`useSankeyData: Total de ${links.length} links válidos preparados`);
        
        // Atualizar os dados para visualizações
        setSankeyData({
          nodes,
          links
        });
        
      } catch (err: any) {
        console.error('Erro ao buscar dados para visualizações de relações:', err);
        setError(err.message);
        
        toast.error('Não foi possível carregar os dados para visualização', {
          description: 'Ocorreu um erro ao buscar os relacionamentos entre nutracêuticos e condições.'
        });
        
        // Usar dados de fallback
        setSankeyData({ nodes: [], links: [] });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return {
    sankeyData,
    isLoading,
    error,
    refresh: () => {
      setIsLoading(true);
      // Re-execute o fetchData
      setSankeyData({ nodes: [], links: [] });
    }
  };
};
