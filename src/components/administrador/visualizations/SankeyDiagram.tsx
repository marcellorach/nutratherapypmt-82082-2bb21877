
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { ZoomIn, ZoomOut, Move, AlertCircle, Info } from 'lucide-react';
import SankeyTooltip from './sankey/SankeyTooltip';
import SankeyDetailsDialog from './sankey/SankeyDetailsDialog';
import { SankeyData, SankeyNode, SankeyLink } from './sankey/types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SankeyDiagramProps {
  data: SankeyData;
  height?: number;
}

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({ data, height = 400 }) => {
  const [scale, setScale] = useState(1);
  const [selectedLink, setSelectedLink] = useState<SankeyLink | null>(null);
  const [selectedSourceNode, setSelectedSourceNode] = useState<SankeyNode | null>(null);
  const [selectedTargetNode, setSelectedTargetNode] = useState<SankeyNode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const processedData = useMemo(() => {
    if (!data || !data.nodes || !data.links) {
      console.log("SankeyDiagram: No data provided");
      return { nodes: [], links: [] };
    }

    console.log("SankeyDiagram processing data:", { 
      nodesCount: data.nodes.length, 
      linksCount: data.links.length 
    });

    // Filtrar nós vazios ou indefinidos
    const validNodes = data.nodes.filter(node => node && node.name);
    
    // Filtrar links inválidos
    const validLinks = data.links.filter(link => 
      typeof link.source === 'number' && 
      typeof link.target === 'number' && 
      link.source < validNodes.length && 
      link.target < validNodes.length &&
      link.value > 0
    );

    console.log("SankeyDiagram after filtering:", { 
      validNodesCount: validNodes.length, 
      validLinksCount: validLinks.length 
    });

    const coloredNodes = validNodes.map((node) => ({
      ...node,
      name: node.name,
      color: node.category === 'nutraceutico' ? '#3b82f6' : 
             node.category === 'condicao' ? '#10b981' : '#f59e0b',
    }));

    const coloredLinks = validLinks.map((link) => {
      const sourceNode = coloredNodes[link.source];
      const targetNode = coloredNodes[link.target];
      
      if (!sourceNode || !targetNode) {
        console.error('Link referindo a nó inexistente:', link);
        return null;
      }
      
      let color;
      if (link.value >= 80) {
        color = 'rgba(16, 185, 129, 0.7)'; // Verde
      } else if (link.value >= 60) {
        color = 'rgba(59, 130, 246, 0.7)'; // Azul
      } else if (link.value >= 40) {
        color = 'rgba(245, 158, 11, 0.7)'; // Amarelo
      } else {
        color = 'rgba(156, 163, 175, 0.7)'; // Cinza
      }

      return {
        ...link,
        color,
        sourceName: sourceNode.name,
        targetName: targetNode.name,
      };
    }).filter(Boolean);

    return { 
      nodes: coloredNodes, 
      links: coloredLinks
    };
  }, [data]);

  const handleLinkClick = (e: any) => {
    if (e && e.payload) {
      const sourceNode = data.nodes[e.payload.source];
      const targetNode = data.nodes[e.payload.target];
      
      setSelectedLink(e.payload);
      setSelectedSourceNode(sourceNode);
      setSelectedTargetNode(targetNode);
      setDialogOpen(true);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
  };
  
  const getDemoData = () => {
    return {
      nodes: [
        { name: 'Glucosamina', category: 'nutraceutico' },
        { name: 'Curcumina', category: 'nutraceutico' },
        { name: 'Ômega 3', category: 'nutraceutico' },
        { name: 'Artrite', category: 'condicao' },
        { name: 'Inflamação', category: 'condicao' },
        { name: 'Saúde Cardíaca', category: 'condicao' }
      ],
      links: [
        { source: 0, target: 3, value: 85 },
        { source: 0, target: 4, value: 40 },
        { source: 1, target: 3, value: 65 },
        { source: 1, target: 4, value: 90 },
        { source: 2, target: 4, value: 75 },
        { source: 2, target: 5, value: 60 }
      ]
    };
  };

  // Usar dados de demonstração se não houver dados válidos
  const finalData = (!processedData.nodes.length || !processedData.links.length) ? getDemoData() : processedData;

  if (!finalData.nodes.length || !finalData.links.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 rounded-lg p-8">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Sem dados para visualização</h3>
        <p className="text-gray-500 text-center mb-6">
          Não há dados suficientes para exibir o diagrama Sankey. Adicione relações entre nutracêuticos e condições de saúde.
        </p>
        <Button variant="outline">Adicionar Relações</Button>
      </div>
    );
  }

  console.log("SankeyDiagram rendering with data:", {
    nodes: finalData.nodes.length,
    links: finalData.links.length,
    height
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Badge variant="outline" className="mr-2">
            {finalData.nodes.filter(n => n.category === 'nutraceutico').length} Nutracêuticos
          </Badge>
          <Badge variant="outline" className="mr-2">
            {finalData.nodes.filter(n => n.category === 'condicao').length} Condições
          </Badge>
          <Badge variant="outline">
            {finalData.links.length} Relações
          </Badge>
        </div>
        <div className="bg-white border rounded-md p-1 shadow-sm">
          <button 
            onClick={handleZoomIn} 
            className="p-1 hover:bg-gray-100 rounded"
            title="Ampliar"
          >
            <ZoomIn size={16} />
          </button>
          <button 
            onClick={handleZoomOut} 
            className="p-1 hover:bg-gray-100 rounded"
            title="Reduzir"
          >
            <ZoomOut size={16} />
          </button>
          <button 
            onClick={handleResetZoom} 
            className="p-1 hover:bg-gray-100 rounded"
            title="Restaurar zoom"
          >
            <Move size={16} />
          </button>
        </div>
      </div>
      
      <div 
        className="overflow-auto relative border rounded-lg" 
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
              nodeWidth={15}
              nodePadding={40}
              linkCurvature={0.5}
              iterations={64}
              node={{
                stroke: "#fff",
                strokeWidth: 1,
                fill: "#8884d8",
              }}
              link={{
                stroke: "#77c878",
                strokeWidth: 2,
                fillOpacity: 0.8,
                onClick: handleLinkClick,
                className: "cursor-pointer hover:opacity-80 transition-opacity"
              }}
              margin={{ top: 20, right: 50, bottom: 20, left: 50 }}
            >
              <Tooltip content={<SankeyTooltip payload={[]} />} />
            </Sankey>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <Info className="h-3 w-3 mr-1" />
          <span>
            {scale < 1 ? "Reduza o zoom" : scale > 1.5 ? "Aumente o zoom" : "Ajuste o zoom"} para melhor visualização
          </span>
        </div>
        <span>Total de relacionamentos: {finalData.links.length}</span>
      </div>

      <SankeyDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedLink={selectedLink}
        selectedSourceNode={selectedSourceNode}
        selectedTargetNode={selectedTargetNode}
      />
    </div>
  );
};

export default SankeyDiagram;
