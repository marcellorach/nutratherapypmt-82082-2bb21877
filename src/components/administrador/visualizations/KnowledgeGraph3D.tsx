import React, { useRef, useCallback, useMemo, useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  Box, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize, 
  Settings, 
  Layers,
  Loader2,
  MousePointer,
  Move,
  AlertTriangle,
  Database,
  Type
} from 'lucide-react';
import SpriteText from 'three-spritetext';

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

// Color mapping for node types - saturated colors for light background
const NODE_COLORS: Record<string, string> = {
  nutraceutical: '#2563eb',  // Deep blue
  compound: '#1d4ed8',
  drug: '#1e40af',
  condition: '#059669',      // Deep green
  disease: '#047857',
  mechanism: '#d97706',      // Deep amber
  effect: '#7c3aed',         // Deep purple
  biological_effect: '#9333ea',
  biologicalprocess: '#6d28d9',
  outcome: '#db2777',        // Deep pink
  target: '#0891b2',         // Deep cyan
  pathway: '#0d9488',
  receptor: '#0e7490',
  enzyme: '#0369a1',
  gene: '#4f46e5',           // Deep indigo
  protein: '#4338ca',
  unknown: '#64748b',
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
    sprite.textHeight = 4;
    sprite.fontFace = 'Inter, system-ui, sans-serif';
    sprite.fontWeight = 'bold';
    sprite.backgroundColor = 'rgba(255, 255, 255, 0.85)';
    sprite.padding = 2;
    sprite.borderRadius = 3;
    
    return sprite;
  }, [showLabels]);

  if (graphError) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500" style={{ backgroundColor: BG_COLOR }}>
        <p>{graphError}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full rounded-lg overflow-hidden border border-slate-200 shadow-sm"
      style={{ height, backgroundColor: BG_COLOR }}
    >
      {/* Controls overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <TooltipProvider>
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-slate-200 shadow-lg">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={is3D ? 'secondary' : 'ghost'} 
                  size="sm"
                  onClick={() => setIs3D(!is3D)}
                  className={is3D ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
                >
                  {is3D ? <Box className="h-4 w-4 mr-1" /> : <Square className="h-4 w-4 mr-1" />}
                  {is3D ? t('knowledgeGraph.viewModes.threeD') : t('knowledgeGraph.viewModes.twoD')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{is3D ? t('knowledgeGraph.controls.switchTo2D') : t('knowledgeGraph.controls.switchTo3D')}</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-slate-200" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('knowledgeGraph.controls.zoomIn', 'Zoom In')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('knowledgeGraph.controls.zoomOut', 'Zoom Out')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleReset} className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('knowledgeGraph.controls.reset', 'Reset View')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleFitView} className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                  <Maximize className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('knowledgeGraph.controls.fitView', 'Fit to View')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={showSettings ? 'secondary' : 'ghost'} 
                  size="icon" 
                  onClick={() => setShowSettings(!showSettings)}
                  className={showSettings ? 'bg-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('knowledgeGraph.controls.settings', 'Settings')}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {showSettings && (
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
        )}
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200 shadow-lg">
          <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
            <Layers className="h-3 w-3 mr-1" />
            {graphData.nodes.length} {t('knowledgeGraph.filters.nodes', 'nodes')}
          </Badge>
          <Badge variant="outline" className={`text-xs bg-transparent ${graphData.links.length > 0 ? 'text-emerald-600 border-emerald-300' : 'text-amber-600 border-amber-300'}`}>
            {graphData.links.length} {t('knowledgeGraph.filters.edges', 'edges')}
          </Badge>
          <Badge className={`text-xs ${is3D ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {is3D ? t('knowledgeGraph.renderModes.webgl3d') : t('knowledgeGraph.renderModes.canvas2d')}
          </Badge>
          <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-300">
            <Database className="h-3 w-3 mr-1" />
            Neo4j
          </Badge>
        </div>
      </div>

      {/* Diagnostics overlay */}
      {showDiagnostics && (
        <div className="absolute top-16 right-4 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-lg text-xs text-slate-600 font-mono max-w-sm">
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

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="flex flex-wrap gap-2 text-xs bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200 max-w-[300px]">
          {Object.entries(NODE_COLORS).slice(0, 8).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1 text-slate-600">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize">{type}</span>
            </span>
          ))}
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
            cooldownTicks={100}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            warmupTicks={50}
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
            linkColor={(link: any) => link.color}
            linkWidth={linkWidth}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            onNodeClick={handleNodeClick}
            onEngineStop={handleEngineStop}
            cooldownTicks={100}
          />
        )}
      </Suspense>
    </div>
  );
};

export default KnowledgeGraph3D;
