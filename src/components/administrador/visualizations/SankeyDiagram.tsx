
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, Move, Plus } from 'lucide-react';

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
  
  // Preparar cores baseadas na categoria
  const processedData = useMemo(() => {
    if (!data || !data.nodes || !data.links) {
      return { nodes: [], links: [] };
    }

    // Atribuir cores baseadas na categoria do nó
    const coloredNodes = data.nodes.map((node) => {
      let color;
      switch (node.category) {
        case 'nutraceutico':
          color = '#3b82f6'; // Azul para nutracêuticos
          break;
        case 'condicao':
          color = '#10b981'; // Verde para condições de saúde
          break;
        case 'efeito':
          color = '#f59e0b'; // Âmbar para efeitos
          break;
        default:
          color = '#6b7280'; // Cinza para outros
      }
      
      return {
        ...node,
        color: node.color || color,
      };
    });

    // Processar links para usar cores baseadas no valor (efeito/eficácia)
    const coloredLinks = data.links.map((link) => {
      // Determinar cor baseada no valor (eficácia)
      let color;
      if (link.value >= 80) {
        color = 'rgba(16, 185, 129, 0.7)'; // Verde para alta eficácia
      } else if (link.value >= 60) {
        color = 'rgba(59, 130, 246, 0.7)'; // Azul para eficácia média-alta
      } else if (link.value >= 40) {
        color = 'rgba(245, 158, 11, 0.7)'; // Âmbar para eficácia média
      } else {
        color = 'rgba(156, 163, 175, 0.7)'; // Cinza para baixa eficácia
      }

      return {
        ...link,
        color: link.color || color,
      };
    });

    return { nodes: coloredNodes, links: coloredLinks };
  }, [data]);

  const CustomTooltip = ({ payload }: any) => {
    if (!payload || !payload.length) return null;
    
    const item = payload[0];
    if (!item || !item.payload) return null;
    
    // Verificações de segurança para source e target
    const source = item.payload.source;
    const target = item.payload.target;
    const value = item.payload.value;
    
    if (!source || !target) return null;
    
    return (
      <div className="bg-white p-3 shadow-lg rounded-md border border-gray-200">
        <p className="text-sm font-medium">
          <span className="text-blue-600">{source.name}</span>
          <span className="mx-1">→</span>
          <span className="text-green-600">{target.name}</span>
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Eficácia: <span className="font-medium">{value}</span>
          {item.payload.labelText && <span className="block mt-1">{item.payload.labelText}</span>}
        </p>
        <p className="text-xs text-gray-500 mt-1">Clique para ver detalhes</p>
      </div>
    );
  };

  // Manipulador para clique em um link
  const handleLinkClick = (e: any) => {
    if (e && e.payload) {
      const { source, target, ...linkData } = e.payload;
      setSelectedLink(linkData);
      setSelectedSourceNode(source);
      setSelectedTargetNode(target);
      setDialogOpen(true);
    }
  };

  // Controles de zoom
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
      {/* Controles de Zoom */}
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
      
      {/* Diagrama Sankey */}
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
            nodePadding={30}
            nodeWidth={15}
            linkCurvature={0.5}
            iterations={64}
            node={{
              stroke: '#fff',
              strokeWidth: 1,
              onClick: (e) => console.log('Node clicked:', e),
            }}
            link={{
              stroke: '#ddd',
              onClick: handleLinkClick,
              className: "cursor-pointer hover:opacity-80 transition-opacity"
            }}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Tooltip content={CustomTooltip} />
          </Sankey>
        </ResponsiveContainer>
      </div>

      {/* Diálogo de Detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Relação Nutraceutico-Condição
            </DialogTitle>
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
                      Nutraceutico
                    </Badge>
                  </div>
                  <div className="text-2xl font-light text-gray-300">→</div>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold text-green-600">
                      {selectedTargetNode.name}
                    </h3>
                    <Badge variant="outline" className="mt-1">
                      Condição de Saúde
                    </Badge>
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
