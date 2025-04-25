
import React, { useEffect, useRef, useState } from 'react';
import { Network, Data, Node, Edge, Options } from 'vis-network/standalone';
import { Search, Filter, ZoomIn, ZoomOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NetworkNode {
  id: number;
  label: string;
  title?: string;
  group?: string;
  value?: number;
  shape?: string;
  color?: {
    background?: string;
    border?: string;
    highlight?: {
      background?: string;
      border?: string;
    }
  };
}

interface NetworkEdge {
  from: number;
  to: number;
  label?: string;
  title?: string;
  value?: number;
  width?: number;
  color?: string;
}

interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

interface NetworkGraphProps {
  data: NetworkGraphData;
  height?: string;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ data, height = '500px' }) => {
  const networkContainer = useRef<HTMLDivElement>(null);
  const network = useRef<Network | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedEntity, setSelectedEntity] = useState<{node?: NetworkNode, edges?: NetworkEdge[]}>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const prepareNetworkData = () => {
    if (!data || !data.nodes || !data.edges) {
      return { nodes: [], edges: [] };
    }

    return {
      nodes: data.nodes.filter(node => 
        selectedFilter === 'all' || node.group === selectedFilter
      ),
      edges: data.edges
    };
  };

  const initNetwork = () => {
    if (networkContainer.current && data) {
      // Opções de configuração da rede
      const options: Options = {
        nodes: {
          shape: 'dot',
          scaling: {
            min: 10,
            max: 30,
            label: {
              enabled: true,
              min: 14,
              max: 24
            }
          },
          font: {
            size: 12,
            face: 'Arial'
          }
        },
        edges: {
          width: 1,
          smooth: {
            type: 'continuous'
          },
          arrows: {
            to: { enabled: true, scaleFactor: 0.5 }
          },
          color: { inherit: 'from' },
          selectionWidth: 2
        },
        physics: {
          stabilization: {
            iterations: 100,
            updateInterval: 25
          },
          barnesHut: {
            gravitationalConstant: -8000,
            springConstant: 0.001,
            springLength: 200
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          navigationButtons: false,
          multiselect: false
        }
      };

      // Criar a visualização de rede
      const networkData = prepareNetworkData();
      
      if (network.current) {
        network.current.destroy();
      }

      network.current = new Network(
        networkContainer.current,
        networkData,
        options
      );
      
      // Configurar eventos
      network.current.on('click', function(properties) {
        if (properties.nodes && properties.nodes.length > 0) {
          const nodeId = properties.nodes[0];
          const node = data.nodes.find(node => node.id === nodeId);
          
          if (node) {
            // Encontrar todas as arestas conectadas a este nó
            const connectedEdges = data.edges.filter(
              edge => edge.from === nodeId || edge.to === nodeId
            );
            
            setSelectedEntity({
              node,
              edges: connectedEdges
            });
            
            setDialogOpen(true);
          }
        }
      });
    }
  };

  // Inicializar rede quando o componente for montado
  useEffect(() => {
    initNetwork();
    
    return () => {
      if (network.current) {
        network.current.destroy();
        network.current = null;
      }
    };
  }, [data, selectedFilter]);

  // Função para destacar nós ao pesquisar
  const handleSearch = () => {
    if (!network.current || !searchTerm.trim()) return;

    const nodeIds = data.nodes
      .filter(node => node.label.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(node => node.id);

    if (nodeIds.length > 0) {
      network.current.selectNodes(nodeIds);
      network.current.focus(nodeIds[0], {
        scale: 1.2,
        animation: true
      });
    }
  };

  // Funções de zoom
  const zoomIn = () => {
    if (network.current) {
      const scale = network.current.getScale() * 1.2;
      network.current.moveTo({ scale });
    }
  };
  
  const zoomOut = () => {
    if (network.current) {
      const scale = network.current.getScale() / 1.2;
      network.current.moveTo({ scale });
    }
  };

  // Função para resetar a visualização
  const resetView = () => {
    if (network.current) {
      network.current.fit({ animation: true });
    }
  };

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Barra de controles */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex-1 flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar nós..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={handleSearch} 
            size="icon" 
            title="Buscar"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center">
          <Select value={selectedFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="nutraceutico">Nutracêuticos</SelectItem>
              <SelectItem value="condicao">Condições</SelectItem>
              <SelectItem value="efeito">Efeitos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={zoomIn} 
            title="Ampliar"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={zoomOut} 
            title="Reduzir"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={resetView}
            className="text-xs"
            title="Ajustar visualização"
          >
            Ajustar
          </Button>
        </div>
      </div>
      
      {/* Container da visualização de rede */}
      <div 
        ref={networkContainer} 
        style={{ height, width: '100%' }} 
        className="border rounded-md bg-slate-50"
      />
      
      {/* Dialog para exibir detalhes do nó selecionado */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEntity.node?.label || 'Detalhes da Entidade'}
            </DialogTitle>
          </DialogHeader>

          {selectedEntity.node && (
            <div className="space-y-4">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-2" 
                  style={{
                    backgroundColor: selectedEntity.node.color?.background || '#6b7280'
                  }}
                />
                <Badge variant="outline">
                  {selectedEntity.node.group === 'nutraceutico' ? 'Nutracêutico' :
                   selectedEntity.node.group === 'condicao' ? 'Condição de Saúde' :
                   selectedEntity.node.group === 'efeito' ? 'Efeito' : 'Entidade'}
                </Badge>
                {selectedEntity.node.value && (
                  <span className="ml-2 text-sm text-gray-500">
                    Relevância: {selectedEntity.node.value}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600">
                {selectedEntity.node.title || 
                  `${selectedEntity.node.label} é ${
                    selectedEntity.node.group === 'nutraceutico' ? 
                      'um nutracêutico com diversas aplicações terapêuticas.' :
                    selectedEntity.node.group === 'condicao' ? 
                      'uma condição de saúde que pode ser tratada com diversos nutracêuticos.' :
                    'um efeito que pode ser produzido por determinados nutracêuticos.'
                  }`
                }
              </p>
              
              {selectedEntity.edges && selectedEntity.edges.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Relações ({selectedEntity.edges.length})</h4>
                  <div className="max-h-64 overflow-y-auto">
                    {selectedEntity.edges.map((edge, idx) => {
                      const targetNode = data.nodes.find(
                        node => node.id === (edge.from === selectedEntity.node?.id ? edge.to : edge.from)
                      );
                      
                      return (
                        <div 
                          key={idx} 
                          className="p-2 border-b last:border-b-0 hover:bg-gray-50"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{targetNode?.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {targetNode?.group === 'nutraceutico' ? 'Nutracêutico' :
                               targetNode?.group === 'condicao' ? 'Condição' : 'Efeito'}
                            </Badge>
                          </div>
                          {edge.label && (
                            <p className="text-xs text-gray-500 mt-1">{edge.label}</p>
                          )}
                          {edge.value && (
                            <p className="text-xs text-gray-500">
                              Eficácia: <span className="font-medium">{edge.value}/100</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NetworkGraph;
