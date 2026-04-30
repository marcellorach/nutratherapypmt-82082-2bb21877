import React, { useEffect, useMemo, useRef, useState } from "react";
import mermaid from "mermaid";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crosshair, Copy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { organograma } from "@/data/projectOrganograma";
import { getAreaMeta } from "@/data/organogramaAreaMeta";
import { useScrollPanZoom } from "@/hooks/useScrollPanZoom";

function safeId(s: string) {
  return s.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
}

function buildMermaid(orientation: "TD" | "LR"): string {
  const lines: string[] = [`flowchart ${orientation}`];
  organograma.forEach((area) => {
    const meta = getAreaMeta(area.key);
    const aId = `A_${safeId(area.key)}`;
    lines.push(`  ${aId}["${area.title}"]:::area_${safeId(area.key)}`);
    (area.children ?? []).forEach((child, ci) => {
      const cId = `${aId}_C${ci}`;
      const label = child.title.replace(/"/g, "'");
      lines.push(`  ${cId}["${label}"]`);
      lines.push(`  ${aId} --> ${cId}`);
    });
    (area.linksTo ?? []).forEach((target) => {
      lines.push(`  ${aId} -.-> A_${safeId(target)}`);
    });
    lines.push(
      `  classDef area_${safeId(area.key)} fill:${meta.hex}22,stroke:${meta.hex},stroke-width:2px,color:#111;`,
    );
  });
  return lines.join("\n");
}

interface Props {
  onJumpToCards?: (areaKey: string) => void;
}

export const OrganogramaDiagram: React.FC<Props> = ({ onJumpToCards }) => {
  const [orientation, setOrientation] = useState<"TD" | "LR">("TD");
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const source = useMemo(() => buildMermaid(orientation), [orientation]);
  const { t } = useTranslation();

  const { containerRef, innerRef, fit, scale, tx, ty } = useScrollPanZoom<HTMLDivElement>({
    min: 0.2,
    max: 4,
    fitMin: 0.4,
  });

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const id = `mmd-${Math.random().toString(36).slice(2)}`;
        const { svg: rendered } = await mermaid.render(id, source);
        if (cancelled) return;
        if (!rendered.includes("<svg")) {
          setError(t('organograma.mermaidEmpty'));
          setSvg("");
          return;
        }
        setSvg(rendered);
        // próximo tick para o SVG existir antes do fit
        requestAnimationFrame(() => fit());
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, fit]);

  const handleCopy = () => {
    navigator.clipboard.writeText(source);
    toast.success(t('organograma.mermaidCopied'));
  };

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={orientation === "TD" ? "default" : "outline"}
              onClick={() => setOrientation("TD")}
            >
              {t('organograma.vertical')}
            </Button>
            <Button
              size="sm"
              variant={orientation === "LR" ? "default" : "outline"}
              onClick={() => setOrientation("LR")}
            >
              {t('organograma.horizontal')}
            </Button>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={fit}>
              <Crosshair className="h-3.5 w-3.5 mr-1" />
              {t('organograma.center')}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5 mr-1" />
              {t('organograma.copyMermaid')}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm flex gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-destructive">{t('organograma.renderFailed')}</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative rounded-md border bg-muted/20 overflow-hidden"
            style={{ height: 820 }}
          >
            <div
              ref={innerRef}
              className="absolute top-0 left-0 [&_svg]:!block [&_svg]:!max-w-none origin-top-left will-change-transform"
              style={{
                transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
                transformOrigin: "0 0",
              }}
            >
              <div
                style={{ width: "max-content", height: "max-content" }}
                dangerouslySetInnerHTML={{ __html: svg }}
                onClick={(e) => {
                  // detecta clique em nó "A_<key>"
                  const target = e.target as HTMLElement;
                  const node = target.closest("[id^='flowchart-A_']") as HTMLElement | null;
                  if (!node) return;
                  const m = node.id.match(/flowchart-A_([^-_]+)/);
                  if (m && onJumpToCards) {
                    const possibleKey = node.id
                      .replace(/^flowchart-A_/, "")
                      .replace(/-\d+$/, "");
                    onJumpToCards(possibleKey.replace(/_/g, "-"));
                  }
                }}
              />
            </div>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center">
          {t('organograma.diagramHint')}
        </p>
      </CardContent>
    </Card>
  );
};

export default OrganogramaDiagram;
