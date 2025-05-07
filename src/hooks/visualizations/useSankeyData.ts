
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SankeyData, SankeyNode, SankeyLink } from '@/components/administrador/visualizations/sankey/types';
import { toast } from 'sonner';

/**
 * Hook para buscar e formatar dados para o diagrama Sankey
 */
export const useSankeyData = () => {
  const [sankeyData, setSankeyData] = useState<SankeyData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Categorias e suas cores
  const CATEGORY_COLORS = {
    nutraceutico: '#3b82f6', // Azul
    condicao: '#10b981',     // Verde
    outcome: '#f59e0b'       // Amarelo
  };
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Buscar nutracêuticos
        const { data: nutraceuticals, error: nutraError } = await supabase
          .from('nutraceuticals')
          .select('id, name, description')
          .order('name');
          
        if (nutraError) throw nutraError;
        
        // Buscar condições de saúde
        const { data: conditions, error: condError } = await supabase
          .from('health_conditions')
          .select('id, name, description')
          .order('name');
          
        if (condError) throw condError;
        
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
        
        // Criar mapa de IDs para índices
        const nutraMap = new Map();
        const conditionMap = new Map();
        
        // Nós - Nutracêuticos
        const nutraNodes: SankeyNode[] = nutraceuticals.map((nutra, index) => {
          nutraMap.set(nutra.id, index);
          return {
            name: nutra.name,
            category: 'nutraceutico',
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
            description: cond.description || `Condição: ${cond.name}`,
            color: CATEGORY_COLORS.condicao
          };
        });
        
        // Todos os nós
        const nodes = [...nutraNodes, ...conditionNodes];
        
        // Links entre nós
        const links: SankeyLink[] = relations
          .filter(rel => 
            nutraMap.has(rel.nutraceutical_id) && 
            conditionMap.has(rel.condition_id)
          )
          .map(rel => {
            const sourceIndex = nutraMap.get(rel.nutraceutical_id);
            const targetIndex = conditionMap.get(rel.condition_id);
            
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
            
            // Determinar tipo de relação em português
            let relationshipType;
            
            switch (rel.relationship_type) {
              case 'prevention':
                relationshipType = 'Prevenção';
                break;
              case 'treatment':
                relationshipType = 'Tratamento';
                break;
              case 'support':
                relationshipType = 'Suporte';
                break;
              default:
                relationshipType = 'Outro';
            }
            
            return {
              source: sourceIndex,
              target: targetIndex,
              value: rel.efficacy_score * 20, // Escala para visualização
              color,
              labelText,
              description: rel.notes || `${relationshipType}: Eficácia ${rel.efficacy_score}/5`,
              relationshipType: rel.relationship_type,
              originalRelation: rel
            };
          });
          
        // Atualizar os dados para o Sankey
        setSankeyData({
          nodes,
          links
        });
        
      } catch (err: any) {
        console.error('Erro ao buscar dados para o diagrama Sankey:', err);
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
