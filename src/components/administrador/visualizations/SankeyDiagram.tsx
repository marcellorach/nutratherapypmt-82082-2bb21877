
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';
import SankeyTooltip from './sankey/SankeyTooltip';
import SankeyDetailsDialog from './sankey/SankeyDetailsDialog';
import { SankeyData, SankeyNode, SankeyLink } from './sankey/types';

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
      return { nodes: [], links: [] };
    }

    const coloredNodes = data.nodes.map((node) => ({
      ...node,
      name: node.name,
      color: node.category === 'nutraceutico' ? '#3b82f6' : 
             node.category === 'condicao' ? '#10b981' : '#f59e0b',
    }));

    const coloredLinks = data.links.map((link) => {
      const sourceNode = coloredNodes[link.source];
      const targetNode = coloredNodes[link.target];
      
      let color;
      if (link.value >= 80) {
        color = 'rgba(16, 185, 129, 0.7)';
      } else if (link.value >= 60) {
        color = 'rgba(59, 130, 246, 0.7)';
      } else if (link.value >= 40) {
        color = 'rgba(245, 158, 11, 0.7)';
      } else {
        color = 'rgba(156, 163, 175, 0.7)';
      }

      return {
        ...link,
        color,
        sourceName: sourceNode.name,
        targetName: targetNode.name,
      };
    });

    return { nodes: coloredNodes, links: coloredLinks };
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

  if (!processedData.nodes.length || !processedData.links.length) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg">
        <p className="text-gray-500">Não há dados suficientes para exibir o diagrama</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-end mb-2 space-x-2">
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
        className="overflow-hidden" 
        style={{ 
          height, 
          transformOrigin: 'center center',
          transform: `scale(${scale})`,
          transition: 'transform 0.3s ease'
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={processedData}
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
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <Tooltip content={<SankeyTooltip payload={[]} />} />
          </Sankey>
        </ResponsiveContainer>
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
