import React, { useRef, useCallback, useMemo, useState, useEffect, lazy, Suspense } from 'react';
import * as d3Force from 'd3-force';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize, 
  Settings, 
  Loader2,
  MousePointer,
  Move,
  AlertTriangle
} from 'lucide-react';
import SpriteText from 'three-spritetext';
import BiologicalLegend from './graph/BiologicalLegend';

const ForceGraphLoadError: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-full text-red-400 bg-[#0a0a0f] p-4">
      <p>{t('knowledgeGraph.errors.forceGraph3DLoad')}</p>
    </div>
  );
};

// Lazy load force-graph components with error logging
const ForceGraph3D = lazy((): Promise<any> =>
  import('react-force-graph-3d')
    .then((module) => {
      console.log('✅ ForceGraph3D loaded successfully');
      return module;
    })
    .catch((error) => {
      console.error('❌ Failed to load ForceGraph3D:', error);
      return { default: ForceGraphLoadError };
    })
) as unknown as React.LazyExoticComponent<React.ComponentType<any>>;

const ForceGraph2D = lazy((): Promise<any> =>
  import('react-force-graph-2d')
    .then((module) => {
      console.log('✅ ForceGraph2D loaded successfully');
      return module;
    })
    .catch((error) => {
      console.error('❌ Failed to load ForceGraph2D:', error);
      return { default: () => null };
    })
) as unknown as React.LazyExoticComponent<React.ComponentType<any>>;

interface Node {
  id: string;
  label: string;
  type: string;
  group?: string;
  connections?: number;
  color?: string | Record<string, string>;
  source?: string;
  properties?: Record<string, any>;
}

interface Link {
  source?: string;
  target?: string;
  from?: string;
  to?: string;
  label?: string;
  value?: number;
  color?: string;
  isNegative?: boolean;
}

interface KnowledgeGraph3DProps {
  data: {
    nodes: Node[];
    links: Link[];
  };
  height?: string;
  onNodeClick?: (nodeId: string, nodeData: any) => void;
  enable3D?: boolean;
}

// Paleta de cores maximamente distintas para fundo claro
const NODE_COLORS: Record<string, string> = {
  // Entidades principais - cores primárias únicas
  nutraceutical: '#22c55e',    // Verde vibrante (natural, saudável)
  compound: '#eab308',         // Amarelo dourado (químico)
  drug: '#3b82f6',             // Azul médio (farmacêutico)
  
  // Condições de saúde - tons de alerta
  condition: '#f97316',        // Laranja vibrante (atenção)
  disease: '#991b1b',          // Vermelho escuro (problema/doença)
  
  // Mecanismos e processos - cor única
  mechanism: '#1e3a5f',        // Azul escuro (processo)
  
  // Efeitos - cores vibrantes distintas
  effect: '#06b6d4',           // Ciano claro (resultado)
  biological_effect: '#71717a', // Cinza (zinc)
  biologicalprocess: '#14b8a6', // Teal (processo bio)
  
  // Alvos e estruturas - cada um distinto
  target: '#0ea5e9',           // Sky blue
  pathway: '#10b981',          // Emerald
  receptor: '#6366f1',         // Indigo
  enzyme: '#f43f5e',           // Rose/coral
  gene: '#a855f7',             // Purple
  protein: '#84cc16',          // Lime verde claro
  outcome: '#d946ef',          // Fuchsia/magenta
  
  unknown: '#64748b',          // Slate (neutro)
};

// Light warm background
const BG_COLOR = '#faf8f5';  // Warm off-white / cream

const getNodeColor = (type: string, source?: string): string => {
  const normalizedType = type?.toLowerCase() || 'unknown';
  const baseColor = NODE_COLORS[normalizedType] || NODE_COLORS.unknown;
  return source === 'study' ? lightenColor(baseColor, 20) : baseColor;
};

const lightenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
};

// Link colors for light background
const getLinkColor = (isNegative?: boolean): string => {
  return isNegative ? '#dc2626' : '#9ca3af';
};

// Sanitize node color - handles both string and vis-network object format
const sanitizeNodeColor = (node: Node): string => {
  if (!node.color) {
    return getNodeColor(node.type, node.source);
  }
  if (typeof node.color === 'object') {
    const colorObj = node.color as any;
    return colorObj.background || colorObj.border || getNodeColor(node.type, node.source);
  }
  return node.color;
};

// Loading fallback component
const GraphLoading = () => (
  <div className="flex items-center justify-center h-full" style={{ backgroundColor: BG_COLOR }}>
    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
  </div>
);

export const KnowledgeGraph3D: React.FC<KnowledgeGraph3DProps> = ({
  data,
  height = '600px',
  onNodeClick,
  enable3D = true,
}) => {
  const { t } = useTranslation();
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [nodeSize, setNodeSize] = useState(5);
  const [linkOpacity, setLinkOpacity] = useState(0.6);
  const [linkWidth, setLinkWidth] = useState(2);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [graphError, setGraphError] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(enable3D);
  const [showLabels, setShowLabels] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle engine stop - zoomToFit for better initial visibility
  const handleEngineStop = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 80);
    }
  }, []);


  // Process data with diagnostics
  const { graphData, diagnostics } = useMemo(() => {
    const inputNodesCount = data.nodes?.length || 0;
    const inputLinksCount = data.links?.length || 0;
    
    console.log('KnowledgeGraph3D - Processing data:', {
      nodesCount: inputNodesCount,
      linksCount: inputLinksCount,
      sampleNode: data.nodes?.[0],
      sampleLink: data.links?.[0]
    });

    const normalizeId = (v: any): string | null => {
      if (v == null) return null;
      if (typeof v === 'object') return normalizeId((v as any).id);
      const s = String(v).trim();
      return s.length ? s : null;
    };

    // Process nodes
    const nodes = (data.nodes || [])
      .map(node => {
        const id = normalizeId(node.id);
        if (!id) return null;

        return {
          id,
          name: node.label || id,
          type: node.type || 'unknown',
          group: node.group || node.type || 'unknown',
          val: Math.max(3, (node.connections || 1) * 2),
          color: sanitizeNodeColor(node),
          source: node.source,
          properties: node.properties,
          connections: node.connections || 0,
        };
      })
      .filter(Boolean) as any[];

    // Create set of valid node IDs for validation
    const nodeIds = new Set(nodes.map(n => n.id));

    // Map links - accept both from/to and source/target formats
    const invalidLinks: any[] = [];
    const links = (data.links || [])
      .map(link => {
        const sourceId = normalizeId(link.source ?? link.from);
        const targetId = normalizeId(link.target ?? link.to);

        return {
          source: sourceId,
          target: targetId,
          value: link.value || 1,
          color: link.color || getLinkColor(link.isNegative),
          isNegative: link.isNegative,
          label: link.label,
          _originalSource: link.source ?? link.from,
          _originalTarget: link.target ?? link.to,
        };
      })
      .filter(link => {
        const valid = !!link.source && !!link.target;
        if (!valid) {
          invalidLinks.push({ reason: 'null_id', link });
        }
        return valid;
      })
      .filter(link => {
        const sourceExists = nodeIds.has(link.source);
        const targetExists = nodeIds.has(link.target);
        if (!sourceExists || !targetExists) {
          invalidLinks.push({ 
            reason: 'missing_node', 
            source: link.source, 
            target: link.target,
            sourceExists, 
            targetExists 
          });
        }
        return sourceExists && targetExists;
      });

    const diagnosticsData = {
      inputNodes: inputNodesCount,
      inputLinks: inputLinksCount,
      processedNodes: nodes.length,
      processedLinks: links.length,
      invalidLinks: invalidLinks.length,
      sampleInvalidLinks: invalidLinks.slice(0, 3),
      sampleNodeIds: Array.from(nodeIds).slice(0, 3),
    };

    console.log('KnowledgeGraph3D - Processed:', diagnosticsData);

    return { 
      graphData: { nodes, links },
      diagnostics: diagnosticsData
    };
  }, [data]);

  // Configure d3 forces - aggressive spreading to avoid center blob
  useEffect(() => {
    if (!fgRef.current) return;
    const fg = fgRef.current;
    const nodeCount = graphData.nodes.length;
    
    // 1. Very strong repulsion that scales with graph size
    const chargeStrength = -Math.max(3000, nodeCount * 8);
    fg.d3Force('charge', d3Force.forceManyBody()
      .strength((node: any) => {
        // Highly connected nodes push harder to break the core
        const connections = node.connections || 1;
        return chargeStrength * (1 + Math.log2(connections + 1));
      })
      .distanceMax(8000)
      .distanceMin(20)
    );
    
    // 2. Links with longer distance
    fg.d3Force('link')?.distance(400).strength(0.05);
    
    // 3. Remove default center force entirely
    fg.d3Force('center', null);
    
    // 4. Add radial force to push nodes outward from center
    fg.d3Force('radial', d3Force.forceRadial(
      (node: any) => {
        const connections = node.connections || 0;
        // Hub nodes go to outer ring, leaf nodes spread in middle
        if (connections > 15) return 600;
        if (connections > 5) return 350;
        return 150 + Math.random() * 200;
      },
      0, 0
    ).strength(0.08));
    
    // 5. Collision detection to prevent overlap
    fg.d3Force('collision', d3Force.forceCollide()
      .radius((node: any) => Math.max(12, (node.val || 3) * 1.5))
      .strength(0.7)
      .iterations(3)
    );
    
    fg.d3ReheatSimulation();
  }, [graphData, is3D]);

  const handleNodeClick = useCallback((node: any) => {
    if (onNodeClick) {
      onNodeClick(node.id, node);
    }
    if (fgRef.current) {
      if (is3D) {
        const distance = 120;
        const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);
        fgRef.current.cameraPosition(
          { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
          node,
          1000
        );
      } else {
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(2, 1000);
      }
    }
  }, [onNodeClick, is3D]);

  const handleZoomIn = () => {
    if (fgRef.current) {
      if (is3D) {
        const currentPos = fgRef.current.cameraPosition();
        fgRef.current.cameraPosition({ z: currentPos.z * 0.7 }, null, 500);
      } else {
        fgRef.current.zoom(fgRef.current.zoom() * 1.5, 500);
      }
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      if (is3D) {
        const currentPos = fgRef.current.cameraPosition();
        fgRef.current.cameraPosition({ z: currentPos.z * 1.3 }, null, 500);
      } else {
        fgRef.current.zoom(fgRef.current.zoom() * 0.7, 500);
      }
    }
  };

  const handleReset = () => {
    if (fgRef.current) {
      if (is3D) {
        fgRef.current.cameraPosition({ x: 0, y: 0, z: 300 }, { x: 0, y: 0, z: 0 }, 1000);
      } else {
        fgRef.current.centerAt(0, 0, 1000);
        fgRef.current.zoom(1, 1000);
      }
    }
  };

  const handleFitView = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(500, 80);
    }
  };

  const nodeLabel = useCallback((node: any) => {
    const sourceLabel = t('knowledgeGraph.nodeTooltip.source');
    return `<div style="background: rgba(255,255,255,0.95); color: #1e293b; padding: 8px 12px; border-radius: 6px; font-size: 13px; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 280px;">
      <strong style="font-size: 14px; color: #0f172a;">${node.name}</strong><br/>
      <span style="color: #64748b; font-size: 11px;">${node.type}</span>
      ${node.connections ? `<br/><span style="color: #7c3aed; font-size: 11px;">${node.connections} connections</span>` : ''}
      ${node.source ? `<br/><span style="color: #059669; font-size: 11px;">${sourceLabel}: ${node.source}</span>` : ''}
    </div>`;
  }, [t]);

  // Custom node object for 3D with SpriteText labels
  const nodeThreeObject = useCallback((node: any) => {
    if (!showLabels) return undefined;
    
    // Create SpriteText label
    const sprite = new SpriteText(node.name);
    sprite.color = '#1e293b';  // Dark text for light background
    sprite.textHeight = 6;
    sprite.fontFace = 'Inter, system-ui, sans-serif';
    sprite.fontWeight = 'bold';
    sprite.backgroundColor = 'rgba(255, 255, 255, 0.92)';
    sprite.borderColor = node.color || '#cbd5e1';
    sprite.borderWidth = 0.4;
    sprite.padding = 3;
    sprite.borderRadius = 4;
    
    return sprite;
  }, [showLabels]);

  // Custom canvas renderer for 2D mode: draws circle + name label
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const radius = Math.max(4, (node.val || 3) * nodeSize * 0.35);

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color || '#64748b';
    ctx.fill();
    ctx.lineWidth = 0.8 / globalScale;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.stroke();

    if (!showLabels) return;

    // Only render labels when zoomed in enough OR for hub nodes (avoids visual noise)
    const isHub = (node.connections || 0) >= 6;
    if (globalScale < 1.2 && !isHub) return;

    const label = node.name as string;
    const fontSize = Math.max(10, 12 / globalScale);
    ctx.font = `${isHub ? '600' : '500'} ${fontSize}px Inter, system-ui, sans-serif`;
    const textWidth = ctx.measureText(label).width;
    const padX = 4 / globalScale;
    const padY = 2 / globalScale;
    const bgW = textWidth + padX * 2;
    const bgH = fontSize + padY * 2;
    const bgX = node.x - bgW / 2;
    const bgY = node.y + radius + 2 / globalScale;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = node.color || '#cbd5e1';
    ctx.lineWidth = 0.6 / globalScale;
    if ((ctx as any).roundRect) {
      ctx.beginPath();
      (ctx as any).roundRect(bgX, bgY, bgW, bgH, 3 / globalScale);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(bgX, bgY, bgW, bgH);
      ctx.strokeRect(bgX, bgY, bgW, bgH);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(label, node.x, bgY + bgH / 2);
  }, [nodeSize, showLabels]);

  const nodePointerAreaPaint = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
    const radius = Math.max(6, (node.val || 3) * nodeSize * 0.45);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fill();
  }, [nodeSize]);

  if (graphError) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500" style={{ backgroundColor: BG_COLOR }}>
        <p>{graphError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div 
        ref={containerRef} 
        className="relative w-full rounded-lg overflow-hidden border border-slate-200 shadow-sm"
        style={{ height, backgroundColor: BG_COLOR }}
      >
        {/* Controls overlay - simplified like 2D graph */}
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handleZoomIn} title={t('knowledgeGraph.controls.zoomIn', 'Zoom In')}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut} title={t('knowledgeGraph.controls.zoomOut', 'Zoom Out')}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleFitView} title={t('knowledgeGraph.controls.fitView', 'Fit to View')}>
              <Maximize className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset} title={t('knowledgeGraph.controls.reset', 'Reset View')}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button 
              variant={showSettings ? 'secondary' : 'outline'} 
              size="icon" 
              onClick={() => setShowSettings(!showSettings)}
              title={t('knowledgeGraph.controls.settings', 'Settings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Settings panel - top left */}
        {showSettings && (
          <div className="absolute top-2 left-2 z-10">
            <Card className="w-72 bg-white/95 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600">{t('knowledgeGraph.settings.nodeSize', 'Node Size')}: {nodeSize}</Label>
                  <Slider
                    value={[nodeSize]}
                    onValueChange={([v]) => setNodeSize(v)}
                    min={2}
                    max={12}
                    step={1}
                    className="[&_[role=slider]]:bg-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600">{t('knowledgeGraph.settings.linkWidth', 'Link Width')}: {linkWidth}</Label>
                  <Slider
                    value={[linkWidth]}
                    onValueChange={([v]) => setLinkWidth(v)}
                    min={0.5}
                    max={5}
                    step={0.5}
                    className="[&_[role=slider]]:bg-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600">{t('knowledgeGraph.settings.linkOpacity', 'Link Opacity')}: {Math.round(linkOpacity * 100)}%</Label>
                  <Slider
                    value={[linkOpacity * 100]}
                    onValueChange={([v]) => setLinkOpacity(v / 100)}
                    min={10}
                    max={100}
                    step={5}
                    className="[&_[role=slider]]:bg-slate-800"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-600">{t('knowledgeGraph.settings.showLabels', 'Show Labels')}</Label>
                  <Button
                    variant={showLabels ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setShowLabels(!showLabels)}
                    className="h-7 px-2"
                  >
                    {showLabels ? 'On' : 'Off'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-600">{t('knowledgeGraph.settings.diagnostics', 'Diagnostics')}</Label>
                  <Button
                    variant={showDiagnostics ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                    className="h-7 px-2"
                  >
                    {showDiagnostics ? 'On' : 'Off'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Diagnostics overlay */}
        {showDiagnostics && (
          <div className="absolute top-14 left-2 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-lg text-xs text-slate-600 font-mono max-w-sm">
            <div className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Pipeline Diagnostics
            </div>
            <div className="space-y-1">
              <div>Input: {diagnostics.inputNodes} nodes, {diagnostics.inputLinks} links</div>
              <div>Processed: {diagnostics.processedNodes} nodes, {diagnostics.processedLinks} links</div>
              <div className={diagnostics.invalidLinks > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                Invalid links: {diagnostics.invalidLinks}
              </div>
              {diagnostics.sampleNodeIds.length > 0 && (
                <div className="text-slate-400 text-[10px] truncate">
                  Node IDs: {diagnostics.sampleNodeIds.join(', ')}...
                </div>
              )}
              {diagnostics.sampleInvalidLinks.length > 0 && (
                <div className="mt-2 text-amber-700">
                  Sample invalid:
                  {diagnostics.sampleInvalidLinks.slice(0, 2).map((inv: any, i: number) => (
                    <div key={i} className="text-[10px] truncate pl-2">
                      {inv.reason}: {inv.source} → {inv.target}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation hints */}
        <div className="absolute bottom-4 right-4 z-10">
          <div className="flex items-center gap-4 text-xs text-slate-500 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200">
            <span className="flex items-center gap-1">
              <MousePointer className="h-3 w-3" />
              {is3D ? t('knowledgeGraph.hints.dragRotate') : t('knowledgeGraph.hints.dragPan')}
            </span>
            <span className="flex items-center gap-1">
              <Move className="h-3 w-3" />
              {is3D ? t('knowledgeGraph.hints.rightDragPan') : t('knowledgeGraph.hints.scrollZoom')}
            </span>
          </div>
        </div>

        {/* Graph container */}
        <Suspense fallback={<GraphLoading />}>
          {is3D ? (
            <ForceGraph3D
              ref={fgRef}
              graphData={graphData}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor={BG_COLOR}
              nodeColor={(node: any) => node.color}
              nodeVal={(node: any) => node.val * nodeSize * 0.5}
              nodeLabel={nodeLabel}
              nodeOpacity={1}
              nodeThreeObject={showLabels ? nodeThreeObject : undefined}
              nodeThreeObjectExtend={showLabels}
              linkColor={(link: any) => link.color}
              linkWidth={linkWidth}
              linkOpacity={linkOpacity}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={1.5}
              linkDirectionalParticleSpeed={0.005}
              onNodeClick={handleNodeClick}
              onEngineStop={handleEngineStop}
              cooldownTicks={400}
              d3AlphaDecay={0.003}
              d3VelocityDecay={0.25}
              warmupTicks={250}
            />
          ) : (
            <ForceGraph2D
              ref={fgRef}
              graphData={graphData}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor={BG_COLOR}
              nodeColor={(node: any) => node.color}
              nodeVal={(node: any) => node.val * nodeSize * 0.5}
              nodeLabel={nodeLabel}
              nodeCanvasObject={nodeCanvasObject}
              nodeCanvasObjectMode={() => 'replace'}
              nodePointerAreaPaint={nodePointerAreaPaint}
              linkColor={(link: any) => link.color}
              linkWidth={linkWidth}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={0.92}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={2}
              onNodeClick={handleNodeClick}
              onEngineStop={handleEngineStop}
              cooldownTicks={400}
              d3AlphaDecay={0.003}
              d3VelocityDecay={0.25}
              warmupTicks={250}
            />
          )}
        </Suspense>
      </div>

      {/* Legend - Biological notation - outside graph container */}
      <div className="mt-3 border-t pt-3">
        <BiologicalLegend />
      </div>
    </div>
  );
};

export default KnowledgeGraph3D;
