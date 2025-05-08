
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  EnhancedSankeyData,
  EnhancedSankeyNode,
  EnhancedSankeyLink,
  NodeCategory
} from '@/components/administrador/visualizations/sankey/types';
import { toast } from 'sonner';

/**
 * Hook para buscar e formatar dados avançados para o diagrama Sankey
 * com múltiplas categorias
 */
export const useEnhancedSankeyData = (initialData?: EnhancedSankeyData) => {
  const [data, setData] = useState<EnhancedSankeyData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  
  // Configuração de cores por categoria
  const CATEGORY_COLORS = {
    nutraceutico: '#3b82f6', // Azul
    condicao: '#10b981',     // Verde
    outcome: '#f59e0b',      // Laranja
    severidade: '#8b5cf6',   // Roxo
    tratabilidade: '#ec4899'  // Rosa
  };
  
  useEffect(() => {
    // Se dados iniciais foram fornecidos, não busque dados novos
    if (initialData) {
      return;
    }
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("useEnhancedSankeyData: Iniciando busca de dados expandidos");
        
        // 1. Buscar nutracêuticos
        const { data: nutraceuticals, error: nutraError } = await supabase
          .from('nutraceuticals')
          .select('id, name, description, chemical_compound, source')
          .order('name');
          
        if (nutraError) throw nutraError;
        console.log(`useEnhancedSankeyData: ${nutraceuticals?.length || 0} nutracêuticos encontrados`);
        
        // 2. Buscar condições de saúde
        const { data: conditions, error: condError } = await supabase
          .from('health_conditions')
          .select('id, name, description')
          .order('name');
          
        if (condError) throw condError;
        console.log(`useEnhancedSankeyData: ${conditions?.length || 0} condições encontradas`);
        
        // 3. Buscar outcomes (pode ser de uma tabela específica)
        // Simulação de outcomes (em produção, buscar da tabela de outcomes)
        const outcomes = [
          { id: 'out_1', name: 'Redução de Dor', description: 'Diminuição da sensação de dor' },
          { id: 'out_2', name: 'Mobilidade Melhorada', description: 'Aumento da amplitude de movimento' },
          { id: 'out_3', name: 'Função Cardiovascular Melhorada', description: 'Melhora dos parâmetros cardíacos' },
          { id: 'out_4', name: 'Redução de Inflamação', description: 'Diminuição de marcadores inflamatórios' },
          { id: 'out_5', name: 'Saúde Cognitiva', description: 'Melhora na cognição e funções mentais' }
        ];
        
        // 4. Adicionar níveis de severidade
        const severityLevels = [
          { id: 'sev_1', name: 'Leve', description: 'Condição de baixa severidade' },
          { id: 'sev_2', name: 'Moderada', description: 'Condição de média severidade' },
          { id: 'sev_3', name: 'Grave', description: 'Condição de alta severidade' }
        ];
        
        // 5. Adicionar níveis de tratabilidade
        const treatabilityLevels = [
          { id: 'treat_1', name: 'Fácil tratamento', description: 'Condição de fácil manejo' },
          { id: 'treat_2', name: 'Tratamento moderado', description: 'Requer tratamento consistente' },
          { id: 'treat_3', name: 'Difícil tratamento', description: 'Requer intervenção complexa' }
        ];
        
        // 6. Buscar relações entre nutracêuticos e condições
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
        console.log(`useEnhancedSankeyData: ${relations?.length || 0} relações encontradas`);
        
        // 7. Criar nós para o diagrama Sankey aprimorado
        
        // Nós de nutracêuticos
        const nutraNodes: EnhancedSankeyNode[] = nutraceuticals.map(nutra => ({
          id: `nutra_${nutra.id}`,
          name: nutra.name,
          category: 'nutraceutico',
          description: nutra.description || `Nutracêutico: ${nutra.name}`,
          value: 30,
          color: CATEGORY_COLORS.nutraceutico,
          metadata: {
            compound: nutra.chemical_compound,
            source: nutra.source
          }
        }));
        
        // Nós de condições
        const conditionNodes: EnhancedSankeyNode[] = conditions.map(cond => ({
          id: `cond_${cond.id}`,
          name: cond.name,
          category: 'condicao',
          description: cond.description || `Condição: ${cond.name}`,
          value: 25,
          color: CATEGORY_COLORS.condicao
        }));
        
        // Nós de outcomes
        const outcomeNodes: EnhancedSankeyNode[] = outcomes.map(outcome => ({
          id: outcome.id,
          name: outcome.name,
          category: 'outcome',
          description: outcome.description,
          value: 20,
          color: CATEGORY_COLORS.outcome
        }));
        
        // Nós de severidade
        const severityNodes: EnhancedSankeyNode[] = severityLevels.map(level => ({
          id: level.id,
          name: level.name,
          category: 'severidade',
          description: level.description,
          value: 15,
          color: CATEGORY_COLORS.severidade
        }));
        
        // Nós de tratabilidade
        const treatabilityNodes: EnhancedSankeyNode[] = treatabilityLevels.map(level => ({
          id: level.id,
          name: level.name,
          category: 'tratabilidade',
          description: level.description,
          value: 15,
          color: CATEGORY_COLORS.tratabilidade
        }));
        
        // Todos os nós
        const allNodes = [
          ...nutraNodes,
          ...conditionNodes,
          ...outcomeNodes,
          ...severityNodes,
          ...treatabilityNodes
        ];
        
        // 8. Criar links para o diagrama Sankey aprimorado
        
        // Links de nutracêuticos para condições (dos dados reais)
        const nutraCondLinks: EnhancedSankeyLink[] = relations.map(rel => {
          // Buscar nós correspondentes
          const sourceNode = nutraNodes.find(node => node.id === `nutra_${rel.nutraceutical_id}`);
          const targetNode = conditionNodes.find(node => node.id === `cond_${rel.condition_id}`);
          
          if (!sourceNode || !targetNode) {
            console.warn("useEnhancedSankeyData: Nó não encontrado para relação", rel);
            return null;
          }
          
          // Determinar cor com base na eficácia
          let color;
          const efficacyScore = rel.efficacy_score || 3;
          
          if (efficacyScore >= 4) {
            color = 'rgba(16, 185, 129, 0.7)'; // Verde - alta eficácia
          } else if (efficacyScore >= 3) {
            color = 'rgba(59, 130, 246, 0.7)'; // Azul - média eficácia
          } else if (efficacyScore >= 2) {
            color = 'rgba(245, 158, 11, 0.7)'; // Laranja - baixa eficácia
          } else {
            color = 'rgba(156, 163, 175, 0.7)'; // Cinza - muito baixa eficácia
          }
          
          // Ajustar valor para visualização (0-100)
          const value = Math.max(efficacyScore * 20, 10);
          
          return {
            source: sourceNode.id,
            target: targetNode.id,
            sourceName: sourceNode.name,
            targetName: targetNode.name,
            value,
            color,
            relationshipType: rel.relationship_type || 'treatment',
            efficacyScore,
            description: rel.notes || `Eficácia: ${efficacyScore}/5`,
            originalRelation: rel
          };
        }).filter(Boolean) as EnhancedSankeyLink[];
        
        // Função para gerar relacionamentos simulados entre categorias
        const generateSimulatedLinks = (
          sourceNodes: EnhancedSankeyNode[], 
          targetNodes: EnhancedSankeyNode[],
          count: number,
          baseValue: number,
          variance: number
        ): EnhancedSankeyLink[] => {
          const links: EnhancedSankeyLink[] = [];
          
          // Garantir que não geramos mais links do que é possível
          const maxLinks = Math.min(count, sourceNodes.length * targetNodes.length);
          
          for (let i = 0; i < maxLinks; i++) {
            const sourceIndex = Math.floor(Math.random() * sourceNodes.length);
            const targetIndex = Math.floor(Math.random() * targetNodes.length);
            const source = sourceNodes[sourceIndex];
            const target = targetNodes[targetIndex];
            
            // Verificar se o link já existe
            const linkExists = links.some(
              link => link.source === source.id && link.target === target.id
            );
            
            if (!linkExists) {
              // Valor base + variância aleatória
              const value = baseValue + Math.floor(Math.random() * variance);
              
              let color;
              if (value >= 80) {
                color = 'rgba(16, 185, 129, 0.7)'; // Verde
              } else if (value >= 60) {
                color = 'rgba(59, 130, 246, 0.7)'; // Azul
              } else if (value >= 40) {
                color = 'rgba(245, 158, 11, 0.7)'; // Laranja
              } else {
                color = 'rgba(156, 163, 175, 0.7)'; // Cinza
              }
              
              links.push({
                source: source.id,
                target: target.id,
                sourceName: source.name,
                targetName: target.name,
                value,
                color,
                efficacyScore: value / 20, // Normalizar para escala 0-5
                treatabilityScore: Math.round((Math.random() * 3 + 2) * 10) / 10 // 2.0-5.0
              });
            } else {
              // Se o link já existe, tentar novamente
              i--;
            }
          }
          
          return links;
        };
        
        // Links simulados de condições para outcomes
        const condOutcomeLinks = generateSimulatedLinks(
          conditionNodes,
          outcomeNodes,
          15, // número aproximado de links
          50,  // valor base
          40   // variância
        );
        
        // Links simulados de outcomes para severidade
        const outcomeSeverityLinks = generateSimulatedLinks(
          outcomeNodes,
          severityNodes,
          10, // número aproximado de links
          40,  // valor base
          30   // variância
        );
        
        // Links simulados de severidade para tratabilidade
        const severityTreatabilityLinks = generateSimulatedLinks(
          severityNodes,
          treatabilityNodes,
          5, // número aproximado de links
          30,  // valor base
          20   // variância
        );
        
        // Todos os links
        const allLinks = [
          ...nutraCondLinks,
          ...condOutcomeLinks,
          ...outcomeSeverityLinks,
          ...severityTreatabilityLinks
        ];
        
        // Atualizar estado com dados formatados
        setData({
          nodes: allNodes,
          links: allLinks
        });
        
      } catch (err: any) {
        console.error('Erro ao buscar dados para visualização Sankey avançada:', err);
        setError(err.message);
        
        toast.error('Não foi possível carregar os dados para visualização', {
          description: 'Ocorreu um erro ao buscar dados para o diagrama Sankey.'
        });
        
        // Usar dados de fallback
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [initialData]);
  
  // Gerar dados de demonstração se não houver dados reais ou enquanto carrega
  const demoData: EnhancedSankeyData = useMemo(() => {
    return {
      nodes: [
        // Nutracêuticos
        { id: 'n_1', name: 'Glucosamina', category: 'nutraceutico', value: 30, color: CATEGORY_COLORS.nutraceutico },
        { id: 'n_2', name: 'Curcumina', category: 'nutraceutico', value: 30, color: CATEGORY_COLORS.nutraceutico },
        { id: 'n_3', name: 'Ômega 3', category: 'nutraceutico', value: 30, color: CATEGORY_COLORS.nutraceutico },
        
        // Condições
        { id: 'c_1', name: 'Artrite', category: 'condicao', value: 25, color: CATEGORY_COLORS.condicao },
        { id: 'c_2', name: 'Inflamação', category: 'condicao', value: 25, color: CATEGORY_COLORS.condicao },
        { id: 'c_3', name: 'Saúde Cardíaca', category: 'condicao', value: 25, color: CATEGORY_COLORS.condicao },
        
        // Outcomes
        { id: 'o_1', name: 'Redução de Dor', category: 'outcome', value: 20, color: CATEGORY_COLORS.outcome },
        { id: 'o_2', name: 'Mobilidade Melhorada', category: 'outcome', value: 20, color: CATEGORY_COLORS.outcome },
        { id: 'o_3', name: 'Função Cardíaca Melhorada', category: 'outcome', value: 20, color: CATEGORY_COLORS.outcome },
        
        // Severidade
        { id: 's_1', name: 'Leve', category: 'severidade', value: 15, color: CATEGORY_COLORS.severidade },
        { id: 's_2', name: 'Moderada', category: 'severidade', value: 15, color: CATEGORY_COLORS.severidade },
        { id: 's_3', name: 'Grave', category: 'severidade', value: 15, color: CATEGORY_COLORS.severidade },
        
        // Tratabilidade
        { id: 't_1', name: 'Fácil tratamento', category: 'tratabilidade', value: 15, color: CATEGORY_COLORS.tratabilidade },
        { id: 't_2', name: 'Tratamento moderado', category: 'tratabilidade', value: 15, color: CATEGORY_COLORS.tratabilidade },
        { id: 't_3', name: 'Difícil tratamento', category: 'tratabilidade', value: 15, color: CATEGORY_COLORS.tratabilidade }
      ],
      links: [
        // Nutracêuticos -> Condições
        { source: 'n_1', target: 'c_1', value: 80, color: 'rgba(16, 185, 129, 0.7)', relationshipType: 'treatment', efficacyScore: 4.0 },
        { source: 'n_2', target: 'c_2', value: 90, color: 'rgba(16, 185, 129, 0.7)', relationshipType: 'prevention', efficacyScore: 4.5 },
        { source: 'n_3', target: 'c_3', value: 60, color: 'rgba(59, 130, 246, 0.7)', relationshipType: 'support', efficacyScore: 3.0 },
        { source: 'n_2', target: 'c_1', value: 45, color: 'rgba(245, 158, 11, 0.7)', relationshipType: 'treatment', efficacyScore: 2.3 },
        
        // Condições -> Outcomes
        { source: 'c_1', target: 'o_1', value: 75, color: 'rgba(245, 158, 11, 0.7)' },
        { source: 'c_1', target: 'o_2', value: 65, color: 'rgba(59, 130, 246, 0.7)' },
        { source: 'c_2', target: 'o_1', value: 80, color: 'rgba(16, 185, 129, 0.7)' },
        { source: 'c_3', target: 'o_3', value: 70, color: 'rgba(59, 130, 246, 0.7)' },
        
        // Outcomes -> Severidade
        { source: 'o_1', target: 's_1', value: 40, color: 'rgba(139, 92, 246, 0.7)' },
        { source: 'o_1', target: 's_2', value: 35, color: 'rgba(139, 92, 246, 0.7)' },
        { source: 'o_2', target: 's_2', value: 45, color: 'rgba(139, 92, 246, 0.7)' },
        { source: 'o_3', target: 's_3', value: 50, color: 'rgba(139, 92, 246, 0.7)' },
        
        // Severidade -> Tratabilidade
        { source: 's_1', target: 't_1', value: 30, color: 'rgba(236, 72, 153, 0.7)' },
        { source: 's_2', target: 't_2', value: 40, color: 'rgba(236, 72, 153, 0.7)' },
        { source: 's_3', target: 't_3', value: 35, color: 'rgba(236, 72, 153, 0.7)' }
      ]
    };
  }, [CATEGORY_COLORS]);
  
  return {
    data: data || demoData,
    isLoading,
    error,
    refresh: () => {
      setIsLoading(true);
      setData(null);
    }
  };
};
