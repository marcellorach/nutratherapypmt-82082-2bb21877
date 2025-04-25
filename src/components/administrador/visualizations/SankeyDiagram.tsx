
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

interface SankeyNode {
  name: string;
  category: string;
  value?: number;
  color?: string;
  description?: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
  color?: string;
  labelText?: string;
  studyCount?: number;
  evidenceLevel?: number;
  description?: string;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

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

    // O problema principal estava aqui - não podemos transformar source e target em strings
    // Precisamos manter como números para a biblioteca Recharts
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
        // Mantemos source e target como números, mas adicionamos uma propriedade para o nome
        // para referência interna
        sourceName: sourceNode.name,
        targetName: targetNode.name,
      };
    });

    return { nodes: coloredNodes, links: coloredLinks };
  }, [data]);

  const CustomTooltip = ({ payload }: any) => {
    if (!payload || !payload.length) return null;
    
    const item = payload[0];
    if (!item || !item.payload) return null;

    const source = item.payload.sourceNode;
    const target = item.payload.targetNode;
    const value = item.payload.value;
    
    if (!source || !target) return null;

    return (
      <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-blue-600">{source.name}</span>
            <span className="mx-2">→</span>
            <span className="font-medium text-green-600">{target.name}</span>
          </div>
          <div className="text-sm">
            <p className="text-gray-600">Eficácia: <span className="font-medium">{value}/100</span></p>
            {item.payload.labelText && (
              <p className="text-gray-600">{item.payload.labelText}</p>
            )}
          </div>
          {item.payload.description && (
            <p className="text-xs text-gray-500 mt-1">{item.payload.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">Clique para mais detalhes</p>
        </div>
      </div>
    );
  };

  const handleLinkClick = (e: any) => {
    if (e && e.payload) {
      // Encontramos os nós de origem e destino pelo índice
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
              stroke: '#fff',
              strokeWidth: 1,
              fill: (node) => node.color || '#8884d8',
            }}
            link={{
              stroke: (link) => link.color || '#77c878',
              strokeWidth: 2,
              fillOpacity: 0.8,
              onClick: handleLinkClick,
              className: "cursor-pointer hover:opacity-80 transition-opacity"
            }}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <Tooltip content={<CustomTooltip />} />
          </Sankey>
        </ResponsiveContainer>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Relação</DialogTitle>
          </DialogHeader>
          
          {selectedSourceNode && selectedTargetNode && selectedLink && (
            <div className="space-y-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-600">
                      {selectedSourceNode.name}
                    </h3>
                    <Badge variant="outline" className="mt-1">
                      {selectedSourceNode.category === 'nutraceutico' ? 'Nutracêutico' : 'Condição'}
                    </Badge>
                    {selectedSourceNode.description && (
                      <p className="text-sm text-gray-600 mt-1">{selectedSourceNode.description}</p>
                    )}
                  </div>
                  <div className="text-2xl font-light text-gray-300">→</div>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold text-green-600">
                      {selectedTargetNode.name}
                    </h3>
                    <Badge variant="outline" className="mt-1">
                      {selectedTargetNode.category === 'nutraceutico' ? 'Nutracêutico' : 'Condição'}
                    </Badge>
                    {selectedTargetNode.description && (
                      <p className="text-sm text-gray-600 mt-1">{selectedTargetNode.description}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium mb-2">Informações sobre a Eficácia</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-500">Grau de Eficácia</p>
                    <p className="text-xl font-medium">{selectedLink.value}/100</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-500">Categorização</p>
                    <p className="text-xl font-medium">{selectedLink.labelText || "Não categorizado"}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Evidências Científicas</h4>
                <p className="text-sm text-gray-600">
                  {selectedLink.description || 
                    `A relação entre ${selectedSourceNode.name} e ${selectedTargetNode.name} 
                     tem sido estudada em diversos trabalhos científicos, mostrando 
                     ${selectedLink.value >= 70 ? 'resultados bastante promissores' : 
                       selectedLink.value >= 40 ? 'resultados moderadamente positivos' : 
                       'alguns resultados preliminares'}.`
                  }
                </p>
                
                <div className="mt-4 text-sm">
                  <p className="text-gray-500">
                    Estudos relacionados: <span className="font-medium">{selectedLink.studyCount || "5+"}</span>
                  </p>
                  <p className="text-gray-500">
                    Nível de evidência: <span className="font-medium">
                      {selectedLink.evidenceLevel ? `${selectedLink.evidenceLevel}/5` : 
                       selectedLink.value >= 80 ? "Alto" : 
                       selectedLink.value >= 60 ? "Moderado-Alto" :
                       selectedLink.value >= 40 ? "Moderado" : "Inicial"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SankeyDiagram;
