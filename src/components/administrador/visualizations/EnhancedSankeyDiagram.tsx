import React, { useMemo, useState, useCallback } from 'react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { ZoomIn, ZoomOut, RotateCw, Filter, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

import { filterValidLinks, convertLinksToNumericIndices } from '@/utils/graph-utils';
import SankeyTooltip from './sankey/SankeyTooltip';
import SankeyDetailsDialog from './sankey/SankeyDetailsDialog';
import SankeyLegend from './sankey/SankeyLegend';
import SankeyFilters from './sankey/SankeyFilters';
import { useEnhancedSankeyData } from '@/hooks/visualizations/useEnhancedSankeyData';
import { EnhancedSankeyData, EnhancedSankeyNode, EnhancedSankeyLink, NodeCategory } from './sankey/types';

interface EnhancedSankeyDiagramProps {
  initialData?: EnhancedSankeyData;
  height?: number;
  showControls?: boolean;
  showFilters?: boolean;
  showLegend?: boolean;
}

const EnhancedSankeyDiagram: React.FC<EnhancedSankeyDiagramProps> = ({
  initialData,
  height = 500,
  showControls = true,
  showFilters = true,
  showLegend = true
}) => {
  // Hooks for data loading
  const { data, isLoading, error } = useEnhancedSankeyData(initialData);

  // Local state
  const [scale, setScale] = useState(1);
  const [selectedLink, setSelectedLink] = useState<EnhancedSankeyLink | null>(null);
  const [selectedNode, setSelectedNode] = useState<EnhancedSankeyNode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filtering state
  const [activeCategories, setActiveCategories] = useState<NodeCategory[]>([
    'nutraceutico', 'condicao', 'outcome', 'severidade'
  ]);
  const [minEfficacy, setMinEfficacy] = useState(0); // 0-100 scale
  const [relationshipType, setRelationshipType] = useState<string>("all");
  
  // Process and filter data based on selected categories and filters
  const processedData = useMemo(() => {
    if (isLoading || !data) {
      return { nodes: [], links: [] };
    }
    
    // Filter nodes by selected categories
    const filteredNodes = data.nodes.filter(node => 
      activeCategories.includes(node.category as NodeCategory)
    );
    
    // Create a map of valid node IDs for quick lookup
    const nodeIdsMap = new Map<string | number, boolean>();
    filteredNodes.forEach(node => {
      nodeIdsMap.set(node.id, true);
    });
    
    // Filter links that connect to selected node categories and meet efficacy threshold
    let filteredLinks = filterValidLinks(data.links, nodeIdsMap)
      .filter(link => link.value >= minEfficacy);
    
    // Filter by relationship type if specified
    if (relationshipType !== "all") {
      filteredLinks = filteredLinks.filter(link => 
        link.relationshipType === relationshipType
      );
    }
    
    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }, [data, isLoading, activeCategories, minEfficacy, relationshipType]);
  
  // Function to convert enhanced data to format compatible with Recharts Sankey
  const formatDataForRecharts = useMemo(() => {
    if (!processedData.nodes.length || !processedData.links.length) {
      return { nodes: [], links: [] };
    }
    
    // Create a map of node IDs to array indices
    const nodeIndexMap = new Map<string | number, number>();
    
    // Create nodes array for Recharts with array indices
    const nodes = processedData.nodes.map((node, index) => {
      nodeIndexMap.set(node.id, index);
      
      return {
        name: node.name,
        category: node.category,
        value: node.value,
        color: node.color,
        description: node.description,
        id: node.id, // Mantendo o ID original para referência
        // Store original node data for reference
        originalNode: node
      };
    });
    
    // Create links array for Recharts with numeric indices
    const links = convertLinksToNumericIndices(processedData.links, nodeIndexMap);
    
    return { nodes, links };
  }, [processedData]);
  
  // Handle zoom controls
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
  };
  
  // Handle link click
  const handleLinkClick = useCallback((e: any) => {
    if (e && e.payload) {
      const originalLink = e.payload.originalLink || e.payload;
      setSelectedLink(originalLink);
      setSelectedNode(null);
      setDialogOpen(true);
    }
  }, []);
  
  // Handle node click
  const handleNodeClick = useCallback((e: any) => {
    if (e && e.payload) {
      const originalNode = e.payload.originalNode || e.payload;
      setSelectedNode(originalNode);
      setSelectedLink(null);
      setDialogOpen(true);
    }
  }, []);

  // Generate demo data if needed
  const getDemoData = () => {
    return {
      nodes: [
        // Nutracêuticos
        { name: 'Glucosamina', category: 'nutraceutico', value: 30, color: '#3b82f6' },
        { name: 'Curcumina', category: 'nutraceutico', value: 30, color: '#3b82f6' },
        { name: 'Ômega 3', category: 'nutraceutico', value: 30, color: '#3b82f6' },
        
        // Condições
        { name: 'Artrite', category: 'condicao', value: 25, color: '#10b981' },
        { name: 'Inflamação', category: 'condicao', value: 25, color: '#10b981' },
        { name: 'Saúde Cardíaca', category: 'condicao', value: 25, color: '#10b981' },
        
        // Outcomes
        { name: 'Redução de Dor', category: 'outcome', value: 20, color: '#f59e0b' },
        { name: 'Mobilidade Melhorada', category: 'outcome', value: 20, color: '#f59e0b' },
        { name: 'Função Cardíaca Melhorada', category: 'outcome', value: 20, color: '#f59e0b' },
        
        // Severidade
        { name: 'Leve', category: 'severidade', value: 15, color: '#8b5cf6' },
        { name: 'Moderada', category: 'severidade', value: 15, color: '#8b5cf6' },
        { name: 'Grave', category: 'severidade', value: 15, color: '#8b5cf6' }
      ],
      links: [
        // Nutracêuticos -> Condições
        { source: 0, target: 3, value: 80, color: 'rgba(16, 185, 129, 0.7)', 
          relationshipType: 'treatment', efficacyScore: 4.0 },
        { source: 1, target: 4, value: 90, color: 'rgba(16, 185, 129, 0.7)', 
          relationshipType: 'prevention', efficacyScore: 4.5 },
        { source: 2, target: 5, value: 60, color: 'rgba(59, 130, 246, 0.7)', 
          relationshipType: 'support', efficacyScore: 3.0 },
        
        // Condições -> Outcomes
        { source: 3, target: 6, value: 75, color: 'rgba(245, 158, 11, 0.7)' },
        { source: 3, target: 7, value: 65, color: 'rgba(59, 130, 246, 0.7)' },
        { source: 4, target: 6, value: 80, color: 'rgba(16, 185, 129, 0.7)' },
        { source: 5, target: 8, value: 70, color: 'rgba(59, 130, 246, 0.7)' },
        
        // Outcomes -> Severidade
        { source: 6, target: 9, value: 40, color: 'rgba(139, 92, 246, 0.7)' },
        { source: 6, target: 10, value: 35, color: 'rgba(139, 92, 246, 0.7)' },
        { source: 7, target: 10, value: 45, color: 'rgba(139, 92, 246, 0.7)' },
        { source: 8, target: 11, value: 50, color: 'rgba(139, 92, 246, 0.7)' }
      ]
    };
  };
  
  // Use demo data if no data or links are available
  const demoData = getDemoData();
  const finalData = (!formatDataForRecharts.nodes.length || !formatDataForRecharts.links.length) 
    ? demoData 
    : formatDataForRecharts;
  
  // Calculate stats for display
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    activeCategories.forEach(category => {
      stats[category] = processedData.nodes.filter(node => node.category === category).length;
    });
    return stats;
  }, [processedData, activeCategories]);
  
  if (isLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-500">Carregando dados de visualização...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="font-medium">Erro ao carregar dados</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showFilters && (
        <SankeyFilters 
          activeCategories={activeCategories}
          setActiveCategories={setActiveCategories}
          minEfficacy={minEfficacy}
          setMinEfficacy={setMinEfficacy}
          relationshipType={relationshipType}
          setRelationshipType={setRelationshipType}
        />
      )}
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(categoryStats).map(([category, count]) => {
            let color = "";
            let textColor = "";
            switch (category) {
              case 'nutraceutico':
                color = "bg-blue-100";
                textColor = "text-blue-700";
                break;
              case 'condicao':
                color = "bg-green-100";
                textColor = "text-green-700";
                break;
              case 'outcome':
                color = "bg-amber-100";
                textColor = "text-amber-700";
                break;
              case 'severidade':
                color = "bg-purple-100";
                textColor = "text-purple-700";
                break;
              case 'tratabilidade':
                color = "bg-rose-100";
                textColor = "text-rose-700";
                break;
              default:
                color = "bg-gray-100";
                textColor = "text-gray-700";
            }
            
            return (
              <Badge key={category} variant="outline" className={`${color} ${textColor}`}>
                {count} {category === 'nutraceutico' ? 'Nutracêuticos' : 
                      category === 'condicao' ? 'Condições' : 
                      category === 'outcome' ? 'Outcomes' : 
                      category === 'severidade' ? 'Níveis de Severidade' : 
                      category === 'tratabilidade' ? 'Tratabilidade' : 
                      category}
              </Badge>
            );
          })}
          <Badge variant="outline">
            {finalData.links.length} Relações
          </Badge>
        </div>
        
        {showControls && (
          <div className="bg-white border rounded-md p-1 shadow-sm">
            <Button 
              onClick={handleZoomIn} 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              title="Ampliar"
            >
              <ZoomIn size={16} />
            </Button>
            <Button 
              onClick={handleZoomOut} 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              title="Reduzir"
            >
              <ZoomOut size={16} />
            </Button>
            <Button 
              onClick={handleResetZoom} 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              title="Resetar zoom"
            >
              <RotateCw size={16} />
            </Button>
          </div>
        )}
      </div>
      
      <div 
        className="overflow-auto relative border rounded-lg bg-white" 
        style={{ 
          height: height || 500, 
          transition: 'transform 0.3s ease'
        }}
      >
        <div
          className="min-w-full min-h-full"
          style={{
            transformOrigin: 'center center',
            transform: `scale(${scale})`,
            transition: 'transform 0.3s ease'
          }}
        >
          <ResponsiveContainer width="100%" height={height || 500}>
            <Sankey
              data={finalData}
              nodeWidth={20}
              nodePadding={50}
              linkCurvature={0.5}
              iterations={64}
              node={{
                stroke: "#fff",
                strokeWidth: 1,
                onClick: handleNodeClick,
                className: "cursor-pointer hover:opacity-80 transition-opacity"
              }}
              link={{
                stroke: "#77c878",
                strokeWidth: 2,
                fillOpacity: 0.8,
                onClick: handleLinkClick,
                className: "cursor-pointer hover:opacity-80 transition-opacity"
              }}
              margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
            >
              <Tooltip content={<SankeyTooltip enhanced />} />
            </Sankey>
          </ResponsiveContainer>
        </div>
      </div>

      {showLegend && <SankeyLegend />}

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <Info className="h-3 w-3 mr-1" />
          <span>
            Clique nos nós e conexões para ver detalhes. {scale < 1 ? "Reduza o zoom" : scale > 1.5 ? "Aumente o zoom" : "Ajuste o zoom"} para melhor visualização.
          </span>
        </div>
        <span>Escala atual: {Math.round(scale * 100)}%</span>
      </div>

      <SankeyDetailsDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        selectedLink={selectedLink}
        selectedNode={selectedNode} 
      />
    </div>
  );
};

export default EnhancedSankeyDiagram;
