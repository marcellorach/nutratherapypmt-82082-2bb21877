import React, { useMemo, useRef, useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crosshair, Maximize2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { organograma, type OrganogramaArea } from "@/data/projectOrganograma";
import { getAreaMeta, AREA_META } from "@/data/organogramaAreaMeta";

interface GraphNode {
  id: string;
  label: string;
  kind: "area" | "leaf";
  areaKey: string;
  color: string;
  size: number;
}

interface GraphLink {
  source: string;
  target: string;
  kind: "tree" | "cross";
}

function buildGraph() {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  organograma.forEach((area: OrganogramaArea) => {
    const meta = getAreaMeta(area.key);
    const areaId = `area:${area.key}`;
    nodes.push({
      id: areaId,
      label: area.title,
      kind: "area",
      areaKey: area.key,
      color: meta.hex,
      size: 14,
    });
    (area.children ?? []).forEach((child, ci) => {
      const leafId = `leaf:${area.key}:${ci}`;
      nodes.push({
        id: leafId,
        label: child.title,
        kind: "leaf",
        areaKey: area.key,
        color: meta.hex,
        size: 4,
      });
      links.push({ source: areaId, target: leafId, kind: "tree" });
    });
    (area.linksTo ?? []).forEach((targetKey) => {
      links.push({ source: areaId, target: `area:${targetKey}`, kind: "cross" });
    });
  });

  return { nodes, links };
}

interface Props {
  onJumpToCards?: (areaKey: string) => void;
}

export const OrganogramaForceGraph: React.FC<Props> = ({ onJumpToCards }) => {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 520 });
  const data = useMemo(buildGraph, []);
  const { t } = useTranslation();

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: node.clientWidth, h: 520 });
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const handleCenter = () => {
    fgRef.current?.zoomToFit?.(400, 60);
  };

  const handleNodeClick = (n: any) => {
    if (n.kind === "area" && onJumpToCards) {
      onJumpToCards(n.areaKey);
    }
  };

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {organograma.map((a) => {
              const meta = getAreaMeta(a.key);
              const Icon = meta.icon;
              return (
                <button
                  key={a.key}
                  onClick={() => onJumpToCards?.(a.key)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border border-border hover:bg-muted transition"
                  style={{ color: meta.hex }}
                  title={a.title}
                >
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" onClick={handleCenter}>
            <Crosshair className="h-3.5 w-3.5 mr-1" />
            {t('organograma.center')}
          </Button>
        </div>
        <div
          ref={containerRef}
          className="rounded-md border bg-muted/20 overflow-hidden"
          style={{ height: 520 }}
        >
          <ForceGraph2D
            ref={fgRef}
            graphData={data}
            width={size.w}
            height={size.h}
            backgroundColor="rgba(0,0,0,0)"
            nodeRelSize={4}
            linkColor={(l: any) =>
              l.kind === "cross" ? "rgba(148,163,184,0.4)" : "rgba(148,163,184,0.25)"
            }
            linkWidth={(l: any) => (l.kind === "cross" ? 1.2 : 0.6)}
            linkDirectionalParticles={(l: any) => (l.kind === "cross" ? 2 : 0)}
            linkDirectionalParticleSpeed={0.006}
            onNodeClick={handleNodeClick}
            cooldownTicks={120}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const r = node.kind === "area" ? 9 : 3.5;
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
              ctx.fillStyle = node.color;
              ctx.fill();
              if (node.kind === "area") {
                ctx.lineWidth = 2 / globalScale;
                ctx.strokeStyle = "rgba(255,255,255,0.8)";
                ctx.stroke();
                const fontSize = 11 / globalScale;
                ctx.font = `${fontSize}px Inter, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillStyle = "hsl(var(--foreground))";
                ctx.fillText(node.label, node.x, node.y + r + 2);
              }
            }}
            nodePointerAreaPaint={(node: any, color, ctx) => {
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, node.kind === "area" ? 12 : 5, 0, 2 * Math.PI);
              ctx.fill();
            }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          {t('organograma.graphHint')}
        </p>
      </CardContent>
    </Card>
  );
};

export default OrganogramaForceGraph;
