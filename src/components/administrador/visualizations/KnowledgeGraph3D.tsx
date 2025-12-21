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
  Loader2
} from 'lucide-react';

// Lazy load force-graph components to handle import errors gracefully
const ForceGraph2D = lazy(() => import('react-force-graph-2d').catch(() => ({ default: () => null })));

interface Node {
  id: string;
  label: string;
  type: string;
  group?: string;
  connections?: number;
  color?: string;
  source?: string;
  properties?: Record<string, any>;
}

interface Link {
  source: string;
  target: string;
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

// Color mapping for node types
const getNodeColor = (type: string, source?: string): string => {
  const normalizedType = type?.toLowerCase() || 'unknown';
  
  const colors: Record<string, string> = {
    nutraceutical: '#3b82f6',
    compound: '#2563eb',
    drug: '#1d4ed8',
    condition: '#10b981',
    disease: '#059669',
    mechanism: '#f59e0b',
    effect: '#8b5cf6',
    biological_effect: '#a855f7',
    biologicalprocess: '#7c3aed',
    outcome: '#ec4899',
    target: '#06b6d4',
    pathway: '#14b8a6',
    receptor: '#0891b2',
    enzyme: '#0e7490',
    gene: '#6366f1',
    protein: '#4f46e5',
  };
  
  const baseColor = colors[normalizedType] || '#6b7280';
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

const getLinkColor = (isNegative?: boolean, confidence?: number): string => {
  if (isNegative) {
    return `rgba(239, 68, 68, ${0.4 + (confidence || 0.5) * 0.4})`;
  }
  return `rgba(34, 197, 94, ${0.3 + (confidence || 0.5) * 0.4})`;
};

// Loading fallback component
const GraphLoading = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

export const KnowledgeGraph3D: React.FC<KnowledgeGraph3DProps> = ({
  data,
  height = '600px',
  onNodeClick,
  enable3D = false, // Disabled by default until 3D is stable
}) => {
  const { t } = useTranslation();
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [nodeSize, setNodeSize] = useState(8);
  const [linkOpacity, setLinkOpacity] = useState(0.6);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [graphError, setGraphError] = useState<string | null>(null);

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

  const graphData = useMemo(() => {
    const nodes = data.nodes.map(node => ({
      id: node.id,
      name: node.label,
      type: node.type,
      group: node.group || node.type,
      val: Math.max(1, (node.connections || 1) / 2),
      color: node.color || getNodeColor(node.type, node.source),
      source: node.source,
      properties: node.properties,
    }));

    const links = data.links.map(link => ({
      source: typeof link.source === 'object' ? (link.source as any).id : link.source,
      target: typeof link.target === 'object' ? (link.target as any).id : link.target,
      value: link.value || 1,
      color: getLinkColor(link.isNegative, link.value),
      isNegative: link.isNegative,
      label: link.label,
    }));

    return { nodes, links };
  }, [data]);

  const handleNodeClick = useCallback((node: any) => {
    if (onNodeClick) {
      onNodeClick(node.id, node);
    }
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(2, 1000);
    }
  }, [onNodeClick]);

  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.5, 500);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 0.7, 500);
    }
  };

  const handleReset = () => {
    if (fgRef.current) {
      fgRef.current.centerAt(0, 0, 1000);
      fgRef.current.zoom(1, 1000);
    }
  };

  const handleFitView = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(500, 50);
    }
  };

  const nodeLabel = useCallback((node: any) => {
    return `<div style="background: rgba(0,0,0,0.8); color: white; padding: 6px 10px; border-radius: 4px; font-size: 12px;">
      <strong>${node.name}</strong><br/>
      <span style="color: #9ca3af;">${node.type}</span>
      ${node.source ? `<br/><span style="color: #6ee7b7;">Source: ${node.source}</span>` : ''}
    </div>`;
  }, []);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = Math.max(12 / globalScale, 3);
    const nodeRadius = Math.sqrt(node.val || 1) * nodeSize;
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1 / globalScale;
    ctx.stroke();
    
    if (globalScale > 0.5) {
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 3;
      ctx.fillText(label, node.x, node.y + nodeRadius + fontSize);
      ctx.shadowBlur = 0;
    }
  }, [nodeSize]);

  if (graphError) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>{graphError}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full bg-background rounded-lg overflow-hidden border"
      style={{ height }}
    >
      {/* Controls overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <TooltipProvider>
          <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm p-2 rounded-lg border shadow-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('knowledgeGraph.controls.zoomIn', 'Zoom In')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('knowledgeGraph.controls.zoomOut', 'Zoom Out')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('knowledgeGraph.controls.reset', 'Reset View')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleFitView}>
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
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('knowledgeGraph.controls.settings', 'Settings')}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {showSettings && (
          <Card className="w-64 bg-background/95 backdrop-blur-sm">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">{t('knowledgeGraph.settings.nodeSize', 'Node Size')}</Label>
                <Slider
                  value={[nodeSize]}
                  onValueChange={([v]) => setNodeSize(v)}
                  min={4}
                  max={16}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t('knowledgeGraph.settings.linkOpacity', 'Link Opacity')}</Label>
                <Slider
                  value={[linkOpacity * 100]}
                  onValueChange={([v]) => setLinkOpacity(v / 100)}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg border shadow-sm">
          <Badge variant="secondary" className="text-xs">
            <Layers className="h-3 w-3 mr-1" />
            {graphData.nodes.length} {t('knowledgeGraph.filters.nodes', 'nodes')}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {graphData.links.length} {t('knowledgeGraph.filters.edges', 'edges')}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            WebGL 2D
          </Badge>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="bg-background/90 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">{t('knowledgeGraph.legend.nutraceutical', 'Nutraceutical')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">{t('knowledgeGraph.legend.condition', 'Condition')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">{t('knowledgeGraph.legend.mechanism', 'Mechanism')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-muted-foreground">{t('knowledgeGraph.legend.effect', 'Effect')}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 mt-1 pt-1 border-t">
                <span className="w-8 h-0.5 bg-green-500" />
                <span className="text-muted-foreground">{t('knowledgeGraph.legend.positive', 'Positive')}</span>
                <span className="w-8 h-0.5 bg-red-500 ml-2" style={{ borderTop: '2px dashed' }} />
                <span className="text-muted-foreground">{t('knowledgeGraph.legend.negative', 'Negative')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graph - 2D only for now */}
      <Suspense fallback={<GraphLoading />}>
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeLabel={nodeLabel}
          nodeColor={(node: any) => node.color}
          nodeVal={(node: any) => node.val * (nodeSize / 8)}
          linkColor={(link: any) => link.color}
          linkWidth={(link: any) => Math.max(1, link.value * 2)}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          onNodeClick={handleNodeClick}
          enableNodeDrag={true}
          cooldownTicks={100}
          warmupTicks={50}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={nodeCanvasObject}
        />
      </Suspense>
    </div>
  );
};

export default KnowledgeGraph3D;
