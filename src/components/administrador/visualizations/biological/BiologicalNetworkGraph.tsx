import React, { useRef, useEffect } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import 'vis-network/styles/vis-network.css';
import { BiologicalNetworkData } from './types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface BiologicalNetworkGraphProps {
  data: BiologicalNetworkData;
  height?: string;
}

const BiologicalNetworkGraph: React.FC<BiologicalNetworkGraphProps> = ({ 
  data, 
  height = '600px' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.nodes.length === 0) return;

    // Estilos por tipo de nó
    const nodeStyles = {
      nutraceutical: {
        shape: 'box',
        color: { background: '#fbbf24', border: '#f59e0b', highlight: { background: '#fcd34d', border: '#f97316' } },
        font: { size: 18, face: 'Inter, sans-serif', bold: true, color: '#78350f' },
        size: 40,
        borderWidth: 3,
        margin: 10
      },
      mechanism: {
        shape: 'ellipse',
        color: { background: '#93c5fd', border: '#3b82f6', highlight: { background: '#bfdbfe', border: '#2563eb' } },
        font: { size: 14, color: '#1e3a8a' },
        size: 30,
        borderWidth: 2
      },
      effect: {
        shape: 'box',
        color: { background: '#c7d2fe', border: '#818cf8', highlight: { background: '#e0e7ff', border: '#6366f1' } },
        font: { size: 13, color: '#4c1d95' },
        size: 25,
        borderWidth: 2,
        margin: 8
      },
      outcome: {
        shape: 'box',
        color: { background: '#cbd5e1', border: '#64748b', highlight: { background: '#e2e8f0', border: '#475569' } },
        font: { size: 13, color: '#334155' },
        size: 25,
        borderWidth: 2,
        margin: 8,
        shapeProperties: { borderRadius: 10 }
      },
      side_effect: {
        shape: 'diamond',
        color: { background: '#fca5a5', border: '#ef4444', highlight: { background: '#fecaca', border: '#dc2626' } },
        font: { size: 12, color: '#7f1d1d' },
        size: 20,
        borderWidth: 2
      }
    };

    // Preparar nós com estilos
    const visNodes = data.nodes.map(node => ({
      id: node.id,
      label: node.label,
      title: node.title || node.label,
      level: node.layer,
      ...nodeStyles[node.type],
      value: node.value
    }));

    // Preparar arestas com estilos por tipo
    const visEdges = data.links.map(link => {
      let edgeStyle: any = {};
      
      switch (link.type) {
        case 'inhibition':
          edgeStyle = {
            color: { color: '#ef4444', highlight: '#dc2626' },
            arrows: { to: { enabled: true, type: 'bar', scaleFactor: 1.2 } },
            width: 3,
            smooth: { type: 'cubicBezier', roundness: 0.5 }
          };
          break;
        case 'stimulation':
          edgeStyle = {
            color: { color: '#10b981', highlight: '#059669' },
            arrows: { to: { enabled: true, type: 'arrow', scaleFactor: 1.2 } },
            width: 3,
            smooth: { type: 'cubicBezier', roundness: 0.5 }
          };
          break;
        case 'modulation':
          edgeStyle = {
            color: { color: '#6366f1', highlight: '#4f46e5' },
            arrows: { to: { enabled: true, type: 'circle', scaleFactor: 1 } },
            width: 2,
            dashes: [5, 5],
            smooth: { type: 'cubicBezier', roundness: 0.5 }
          };
          break;
      }

      return {
        id: link.id,
        from: link.from,
        to: link.to,
        title: link.title || `${link.from} → ${link.to}`,
        label: link.label,
        ...edgeStyle
      };
    });

    // Opções de layout hierárquico
    const options = {
      layout: {
        hierarchical: {
          enabled: true,
          direction: 'LR', // Left to Right (como diagrama Curcumina)
          sortMethod: 'directed',
          levelSeparation: 250,
          nodeSpacing: 180,
          treeSpacing: 200,
          blockShifting: true,
          edgeMinimization: true,
          parentCentralization: true
        }
      },
      physics: {
        enabled: false // Desabilitar física para layout fixo
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        zoomView: true,
        dragView: true,
        navigationButtons: true,
        keyboard: {
          enabled: true
        }
      },
      nodes: {
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.15)',
          size: 8,
          x: 2,
          y: 2
        }
      },
      edges: {
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.1)',
          size: 4
        }
      }
    };

    // Criar DataSets
    const nodesDataSet = new DataSet(visNodes);
    const edgesDataSet = new DataSet(visEdges);

    // Criar rede
    networkRef.current = new Network(
      containerRef.current,
      { nodes: nodesDataSet as any, edges: edgesDataSet as any },
      options
    );

    // Fit inicial
    setTimeout(() => {
      networkRef.current?.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    }, 300);

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [data]);

  if (data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Dados insuficientes para visualização de rede biológica
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800">
          <strong>Legenda:</strong> 🟡 Nutracêutico | 🔵 Mecanismo/Pathway | 🔘 Outcome | 🔶 Efeito Colateral | 
          🟢 Estimulação (→) | 🔴 Inibição (⊣) | 🟣 Modulação (⊸)
        </AlertDescription>
      </Alert>
      
      <div 
        ref={containerRef} 
        style={{ 
          height, 
          border: '1px solid hsl(var(--border))',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          backgroundColor: '#fafafa'
        }}
        className="shadow-sm"
      />
    </div>
  );
};

export default BiologicalNetworkGraph;
