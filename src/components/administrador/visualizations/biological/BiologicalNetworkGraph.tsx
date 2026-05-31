import React, { useRef, useEffect, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { BiologicalNetworkData, BiologicalNode, BiologicalLink } from './types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { calculateEdgeWidth } from '@/utils/score-normalization';
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
  const [showNutraceuticals, setShowNutraceuticals] = useState(true);
  const [showMechanisms, setShowMechanisms] = useState(true);
  const [showOutcomes, setShowOutcomes] = useState(true);
  const [showSideEffects, setShowSideEffects] = useState(true);

  useEffect(() => {
    if (!containerRef.current || data.nodes.length === 0) return;

    // Filtrar nós baseado nos filtros ativos
    const filteredNodes = data.nodes.filter(node => {
      if (node.type === 'nutraceutical' && !showNutraceuticals) return false;
      if (node.type === 'mechanism' && !showMechanisms) return false;
      if (node.type === 'outcome' && !showOutcomes) return false;
      if (node.type === 'side_effect' && !showSideEffects) return false;
      return true;
    });

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = data.links.filter(link => 
      filteredNodeIds.has(link.from) && filteredNodeIds.has(link.to)
    );

    // Estilos por tipo de nó
    const getNodeStyle = (node: BiologicalNode) => {
      const isVirtual = node.label?.includes('(ref)') || false;
      
      const baseStyles = {
        nutraceutical: {
          shape: 'box',
          color: { 
            background: isVirtual ? '#fde68a' : '#fbbf24',
            border: isVirtual ? '#fbbf24' : '#f59e0b'
          },
          font: { 
            size: isVirtual ? 14 : 18,
            face: 'Inter, sans-serif', 
            bold: true, 
            color: '#78350f' 
          },
          size: isVirtual ? 30 : 40,
          borderWidth: isVirtual ? 2 : 3,
          margin: 10,
          shapeProperties: {
            borderDashes: isVirtual ? [5, 5] : false
          }
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
      
      return baseStyles[node.type];
    };

    // Preparar nós com estilos
    const visNodes = filteredNodes.map(node => ({
      id: node.id,
      label: node.label,
      title: node.title || node.label,
      level: node.layer,
      ...getNodeStyle(node),
      value: node.value
    }));

    // Preparar arestas com estilos por tipo e ESPESSURA DINÂMICA baseada em confidence
    const visEdges = filteredLinks.map((link: BiologicalLink) => {
      // Calculate dynamic width based on confidence (1-5px)
      const dynamicWidth = calculateEdgeWidth(link.confidence);
      
      let edgeStyle: any = {};
      
      switch (link.type) {
        case 'inhibition':
          edgeStyle = {
            color: { color: '#ef4444', highlight: '#dc2626' },
            arrows: { to: { enabled: true, type: 'bar', scaleFactor: 1.2 } },
            width: dynamicWidth,
            smooth: { type: 'cubicBezier', roundness: 0.5 }
          };
          break;
        case 'stimulation':
          edgeStyle = {
            color: { color: '#10b981', highlight: '#059669' },
            arrows: { to: { enabled: true, type: 'arrow', scaleFactor: 1.2 } },
            width: dynamicWidth,
            smooth: { type: 'cubicBezier', roundness: 0.5 }
          };
          break;
        case 'modulation':
          edgeStyle = {
            color: { color: '#6366f1', highlight: '#4f46e5' },
            arrows: { to: { enabled: true, type: 'circle', scaleFactor: 1 } },
            width: Math.max(1, dynamicWidth - 1), // Slightly thinner for modulation
            dashes: [5, 5],
            smooth: { type: 'cubicBezier', roundness: 0.5 }
          };
          break;
      }

      return {
        id: link.id,
        from: link.from,
        to: link.to,
        title: `${link.title || `${link.from} → ${link.to}`}\nConfiança: ${((link.confidence || 0.5) * 100).toFixed(0)}%`,
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
  }, [data, showNutraceuticals, showMechanisms, showOutcomes, showSideEffects]);

  const nutraCount = data.nodes.filter(n => n.type === 'nutraceutical').length;
  const mechCount = data.nodes.filter(n => n.type === 'mechanism').length;
  const outcomeCount = data.nodes.filter(n => n.type === 'outcome').length;
  const sideEffectCount = data.nodes.filter(n => n.type === 'side_effect').length;

  if (data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Dados insuficientes para visualização de rede biológica
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filtros Interativos */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border">
        <span className="font-semibold text-sm">Filtros:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showNutraceuticals} 
            onChange={(e) => setShowNutraceuticals(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm">🟡 Nutracêuticos ({nutraCount})</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showMechanisms} 
            onChange={(e) => setShowMechanisms(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm">🔵 Mecanismos ({mechCount})</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showOutcomes} 
            onChange={(e) => setShowOutcomes(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm">🔘 Outcomes ({outcomeCount})</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showSideEffects} 
            onChange={(e) => setShowSideEffects(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm">🔶 Efeitos Colaterais ({sideEffectCount})</span>
        </label>
      </div>

      {/* Legenda Completa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Legenda de Tipos de Setas */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            <strong>Tipo de Relação:</strong><br/>
            <span className="inline-flex items-center gap-1">
              <span className="w-6 h-0.5 bg-emerald-500 inline-block"></span> Estimulação (→)
            </span> | 
            <span className="inline-flex items-center gap-1 ml-1">
              <span className="w-6 h-0.5 bg-red-500 inline-block"></span> Inibição (⊣)
            </span> | 
            <span className="inline-flex items-center gap-1 ml-1">
              <span className="w-6 h-0.5 bg-indigo-500 inline-block border-dashed border-t-2 border-indigo-500" style={{ height: 0, borderStyle: 'dashed' }}></span> Modulação
            </span><br/>
            <span className="text-xs opacity-75">Nós tracejados = Dados inferidos</span>
          </AlertDescription>
        </Alert>

        {/* Legenda de Espessura (Confiança/Evidência) */}
        <Alert className="bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800">
            <strong>Espessura = Confiança:</strong>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-8 bg-gray-600 rounded" style={{ height: '1px' }}></span>
                <span className="text-xs">Baixa (≤30%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-8 bg-gray-600 rounded" style={{ height: '2px' }}></span>
                <span className="text-xs">Média (40-60%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-8 bg-gray-600 rounded" style={{ height: '3px' }}></span>
                <span className="text-xs">Alta (70-85%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-8 bg-gray-600 rounded" style={{ height: '5px' }}></span>
                <span className="text-xs">Muito Alta (≥90%)</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
      
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
