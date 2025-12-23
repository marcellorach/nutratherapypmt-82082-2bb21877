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
  Move
} from 'lucide-react';

const ForceGraphLoadError: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-full text-red-400 bg-[#0a0a0f] p-4">
      <p>{t('knowledgeGraph.errors.forceGraph3DLoad')}</p>
    </div>
  );
};

// Lazy load force-graph components with error logging
// NOTE: react-force-graph-3d exports a component type that includes ref typing (FCwithRef).
// Our fallback component doesn't need to match that ref typing, so we cast the lazy component
// to a generic ComponentType to keep TypeScript happy while preserving runtime behavior.
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

// Color mapping for node types - brighter colors for dark background
const getNodeColor = (type: string, source?: string): string => {
  const normalizedType = type?.toLowerCase() || 'unknown';
  
  const colors: Record<string, string> = {
    nutraceutical: '#60a5fa',  // Bright blue
    compound: '#3b82f6',
    drug: '#2563eb',
    condition: '#34d399',      // Bright green
    disease: '#10b981',
    mechanism: '#fbbf24',      // Bright yellow
    effect: '#a78bfa',         // Bright purple
    biological_effect: '#c084fc',
    biologicalprocess: '#8b5cf6',
    outcome: '#f472b6',        // Bright pink
    target: '#22d3ee',         // Bright cyan
    pathway: '#2dd4bf',
    receptor: '#06b6d4',
    enzyme: '#0891b2',
    gene: '#818cf8',           // Bright indigo
    protein: '#6366f1',
  };
  
  const baseColor = colors[normalizedType] || '#94a3b8';
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

// Link colors for dark background - return HEX for three.js compatibility
const getLinkColor = (isNegative?: boolean): string => {
  if (isNegative) {
    return '#f87171'; // Red - opacity controlled by linkOpacity prop
  }
  return '#888888'; // Light gray - opacity controlled by linkOpacity prop
};

// Sanitize node color - handles both string and vis-network object format
const sanitizeNodeColor = (node: Node): string => {
  if (!node.color) {
    return getNodeColor(node.type, node.source);
  }
  // If color is an object (vis-network format), extract background color
  if (typeof node.color === 'object') {
    const colorObj = node.color as any;
    return colorObj.background || colorObj.border || getNodeColor(node.type, node.source);
  }
  // If it's already a string, use it directly
  return node.color;
};

// Loading fallback component
const GraphLoading = () => (
  <div className="flex items-center justify-center h-full bg-[#0a0a0f]">
    <Loader2 className="h-8 w-8 animate-spin text-white/50" />
  </div>
);

export const KnowledgeGraph3D: React.FC<KnowledgeGraph3DProps> = ({
  data,
  height = '600px',
  onNodeClick,
  enable3D = true, // Enable 3D by default now
}) => {
  const { t } = useTranslation();
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [nodeSize, setNodeSize] = useState(4);
  const [linkOpacity, setLinkOpacity] = useState(0.3);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [graphError, setGraphError] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(enable3D);

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
      fgRef.current.zoomToFit(500, 50);
    }
  }, []);

  const graphData = useMemo(() => {
    console.log('KnowledgeGraph3D - Processing data:', {
      nodesCount: data.nodes.length,
      linksCount: data.links.length,
      sampleNode: data.nodes[0],
      sampleLink: data.links[0]
    });

    const normalizeId = (v: any): string | null => {
      if (v == null) return null;
      if (typeof v === 'object') return normalizeId((v as any).id);
      const s = String(v).trim();
      return s.length ? s : null;
    };

    const nodes = data.nodes
      .map(node => {
        const id = normalizeId(node.id);
        if (!id) return null;

        return {
          id,
          name: node.label,
          type: node.type,
          group: node.group || node.type,
          val: Math.max(2, (node.connections || 1) * 1.5), // Slightly larger nodes for visibility
          color: sanitizeNodeColor(node), // Use sanitized color
          source: node.source,
          properties: node.properties,
        };
      })
      .filter(Boolean) as any[];

    // Create set of valid node IDs for validation
    const nodeIds = new Set(nodes.map(n => n.id));

    // Map links - accept both from/to and source/target formats
    const links = data.links
      .map(link => {
        const sourceId = normalizeId(link.source ?? link.from);
        const targetId = normalizeId(link.target ?? link.to);

        return {
          source: sourceId,
          target: targetId,
          value: link.value || 1,
          color: getLinkColor(link.isNegative),
          isNegative: link.isNegative,
          label: link.label,
        };
      })
      // Filter out invalid links where source or target is missing
      .filter(link => !!link.source && !!link.target)
      // Keep only links whose endpoints exist in the nodes list
      .filter(link => nodeIds.has(link.source) && nodeIds.has(link.target));

    console.log('KnowledgeGraph3D - Processed data:', {
      nodesCount: nodes.length,
      validLinksCount: links.length,
      invalidLinksFiltered: data.links.length - links.length
    });

    // If everything got filtered, log one sample to help debugging
    if (links.length === 0 && data.links.length > 0 && nodes.length > 0) {
      const raw = data.links[0];
      const sampleSource = normalizeId((raw as any).source ?? (raw as any).from);
      const sampleTarget = normalizeId((raw as any).target ?? (raw as any).to);
      console.log('KnowledgeGraph3D - Debug membership sample:', {
        sampleSource,
        sampleTarget,
        sampleSourceExists: !!sampleSource && nodeIds.has(sampleSource),
        sampleTargetExists: !!sampleTarget && nodeIds.has(sampleTarget),
        firstNodeId: nodes[0]?.id
      });
    }

    return { nodes, links };
  }, [data]);

  const handleNodeClick = useCallback((node: any) => {
    if (onNodeClick) {
      onNodeClick(node.id, node);
    }
    if (fgRef.current) {
      if (is3D) {
        // 3D camera movement
        const distance = 150;
        const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
        fgRef.current.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
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
        fgRef.current.cameraPosition({ x: 0, y: 0, z: 400 }, { x: 0, y: 0, z: 0 }, 1000);
      } else {
        fgRef.current.centerAt(0, 0, 1000);
        fgRef.current.zoom(1, 1000);
      }
    }
  };

  const handleFitView = () => {
    if (fgRef.current) {
      if (is3D) {
        fgRef.current.zoomToFit(500, 100);
      } else {
        fgRef.current.zoomToFit(500, 50);
      }
    }
  };

  const nodeLabel = useCallback((node: any) => {
    const sourceLabel = t('knowledgeGraph.nodeTooltip.source');

    return `<div style="background: rgba(0,0,0,0.9); color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; border: 1px solid rgba(255,255,255,0.1);">
      <strong style="font-size: 14px;">${node.name}</strong><br/>
      <span style="color: #9ca3af; font-size: 11px;">${node.type}</span>
      ${node.source ? `<br/><span style="color: #6ee7b7; font-size: 11px;">${sourceLabel}: ${node.source}</span>` : ''}
    </div>`;
  }, [t]);

  if (graphError) {
    return (
      <div className="flex items-center justify-center h-full text-white/50 bg-[#0a0a0f]">
        <p>{graphError}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full rounded-lg overflow-hidden border border-white/10"
      style={{ height, backgroundColor: '#0a0a0f' }}
    >
      {/* Controls overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <TooltipProvider>
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm p-2 rounded-lg border border-white/10 shadow-xl">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={is3D ? 'secondary' : 'ghost'} 
                  size="sm"
                  onClick={() => setIs3D(!is3D)}
                  className={is3D ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}
                >
                  {is3D ? <Box className="h-4 w-4 mr-1" /> : <Square className="h-4 w-4 mr-1" />}
                  {is3D ? t('knowledgeGraph.viewModes.threeD') : t('knowledgeGraph.viewModes.twoD')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{is3D ? t('knowledgeGraph.controls.switchTo2D') : t('knowledgeGraph.controls.switchTo3D')}</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-white/20" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-white/70 hover:text-white hover:bg-white/10">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('knowledgeGraph.controls.zoomIn', 'Zoom In')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-white/70 hover:text-white hover:bg-white/10">
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('knowledgeGraph.controls.zoomOut', 'Zoom Out')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleReset} className="text-white/70 hover:text-white hover:bg-white/10">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('knowledgeGraph.controls.reset', 'Reset View')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleFitView} className="text-white/70 hover:text-white hover:bg-white/10">
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
                  className={showSettings ? 'bg-white/20' : 'text-white/70 hover:text-white hover:bg-white/10'}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('knowledgeGraph.controls.settings', 'Settings')}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {showSettings && (
          <Card className="w-64 bg-black/80 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-white/70">{t('knowledgeGraph.settings.nodeSize', 'Node Size')}</Label>
                <Slider
                  value={[nodeSize]}
                  onValueChange={([v]) => setNodeSize(v)}
                  min={1}
                  max={10}
                  step={1}
                  className="[&_[role=slider]]:bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-white/70">{t('knowledgeGraph.settings.linkOpacity', 'Link Opacity')}</Label>
                <Slider
                  value={[linkOpacity * 100]}
                  onValueChange={([v]) => setLinkOpacity(v / 100)}
                  min={5}
                  max={60}
                  step={5}
                  className="[&_[role=slider]]:bg-white"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 shadow-xl">
          <Badge variant="secondary" className="text-xs bg-white/10 text-white/80 border-white/10">
            <Layers className="h-3 w-3 mr-1" />
            {graphData.nodes.length} {t('knowledgeGraph.filters.nodes', 'nodes')}
          </Badge>
          <Badge variant="outline" className="text-xs bg-transparent text-white/60 border-white/20">
            {graphData.links.length} {t('knowledgeGraph.filters.edges', 'edges')}
          </Badge>
          <Badge className={`text-xs ${is3D ? 'bg-blue-600/80 text-white' : 'bg-white/10 text-white/80'}`}>
            {is3D ? t('knowledgeGraph.renderModes.webgl3d') : t('knowledgeGraph.renderModes.canvas2d')}
          </Badge>
        </div>
      </div>

      {/* Navigation hints */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="flex items-center gap-4 text-xs text-white/40 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
          <span className="flex items-center gap-1">
            <MousePointer className="h-3 w-3" />
            {is3D ? t('knowledgeGraph.hints.dragRotate') : t('knowledgeGraph.hints.dragPan')}
          </span>
          <span className="flex items-center gap-1">
            <Move className="h-3 w-3" />
            {is3D ? t('knowledgeGraph.hints.rightDragPan') : ''}
          </span>
          <span>{t('knowledgeGraph.hints.scrollZoom')}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="bg-black/60 backdrop-blur-sm border-white/10">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#60a5fa' }} />
                <span className="text-white/60">{t('knowledgeGraph.legend.nutraceutical', 'Nutraceutical')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#34d399' }} />
                <span className="text-white/60">{t('knowledgeGraph.legend.condition', 'Condition')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fbbf24' }} />
                <span className="text-white/60">{t('knowledgeGraph.legend.mechanism', 'Mechanism')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#a78bfa' }} />
                <span className="text-white/60">{t('knowledgeGraph.legend.effect', 'Effect')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graph - 3D or 2D based on toggle */}
      <Suspense fallback={<GraphLoading />}>
        {is3D ? (
          <ForceGraph3D
            ref={fgRef}
            graphData={graphData}
            backgroundColor="#0a0a0f"
            nodeLabel={nodeLabel}
            nodeColor={(node: any) => node.color}
            nodeVal={(node: any) => node.val * nodeSize}
            nodeOpacity={1.0}
            linkColor={(link: any) => link.color}
            linkWidth={1}
            linkOpacity={linkOpacity}
            onNodeClick={handleNodeClick}
            onEngineStop={handleEngineStop}
            enableNodeDrag={true}
            enableNavigationControls={true}
            showNavInfo={false}
            warmupTicks={100}
            cooldownTicks={0}
            width={dimensions.width}
            height={dimensions.height}
          />
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            backgroundColor="#0a0a0f"
            nodeLabel={nodeLabel}
            nodeColor={(node: any) => node.color}
            nodeVal={(node: any) => node.val * nodeSize}
            linkColor={(link: any) => link.color}
            linkWidth={0.5}
            onNodeClick={handleNodeClick}
            enableNodeDrag={true}
            cooldownTicks={100}
            warmupTicks={50}
            width={dimensions.width}
            height={dimensions.height}
          />
        )}
      </Suspense>
    </div>
  );
};

export default KnowledgeGraph3D;
