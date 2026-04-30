import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search, Code2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useLocalizedField } from "@/hooks/useLocalizedField";
import { getAreaMeta } from "@/data/organogramaAreaMeta";
import { AreaMiniTimeline } from "./AreaMiniTimeline";
import {
  organograma,
  organogramaAscii,
  type OrganogramaArea,
  type OrganogramaNode,
} from "@/data/projectOrganograma";

function nodeMatchesQuery(node: OrganogramaNode, q: string, isEn: boolean): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const title = (isEn ? node.title_en : null) || node.title;
  const desc = (isEn ? node.description_en : null) || node.description;
  if (title.toLowerCase().includes(needle)) return true;
  if (desc?.toLowerCase().includes(needle)) return true;
  if (node.files?.some((f) => f.toLowerCase().includes(needle))) return true;
  if (node.children?.some((c) => nodeMatchesQuery(c, needle, isEn))) return true;
  return false;
}

interface OrgNodeProps {
  node: OrganogramaNode;
  depth: number;
  query: string;
  expandSignal: number;
  collapseSignal: number;
  forceOpen?: boolean;
}

function OrgNode({ node, depth, query, expandSignal, collapseSignal, forceOpen }: OrgNodeProps) {
  const hasChildren = !!node.children?.length;
  const initiallyOpen = !!query || depth < 1;
  const [open, setOpen] = useState(initiallyOpen);
  const { localizedField } = useLocalizedField();

  React.useEffect(() => {
    if (expandSignal > 0 || forceOpen) setOpen(true);
  }, [expandSignal, forceOpen]);
  React.useEffect(() => {
    if (collapseSignal > 0) setOpen(false);
  }, [collapseSignal]);

  if (query && !nodeMatchesQuery(node, query)) return null;

  return (
    <div className={cn("relative", depth > 0 && "border-l border-border/60 ml-3 pl-4")}>
      <div className="flex items-start gap-2 py-1.5">
        {hasChildren ? (
          <button type="button" onClick={() => setOpen((v) => !v)} className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded hover:bg-muted text-muted-foreground">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{localizedField(node, 'title')}</p>
          {(node.description || node.description_en) && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{localizedField(node, 'description')}</p>
          )}
          {node.files && node.files.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {node.files.map((f) => (
                <Badge
                  key={f}
                  variant="outline"
                  className="text-[10px] font-mono py-0 px-1.5 h-5 gap-1"
                >
                  <Code2 className="h-2.5 w-2.5" />
                  {f}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      {hasChildren && open && (
        <div>
          {node.children!.map((child, i) => (
            <OrgNode
              key={`${child.title}-${i}`}
              node={child}
              depth={depth + 1}
              query={query}
              expandSignal={expandSignal}
              collapseSignal={collapseSignal}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  highlightedAreaKey?: OrganogramaArea["key"] | null;
}

export const OrganogramaCards: React.FC<Props> = ({ highlightedAreaKey }) => {
  const [query, setQuery] = useState("");
  const [asciiMode, setAsciiMode] = useState(false);
  const [expandSignal, setExpandSignal] = useState(0);
  const [collapseSignal, setCollapseSignal] = useState(0);
  const { t } = useTranslation();
  const { localizedField, isEnglish } = useLocalizedField();

  const visible = useMemo(
    () => organograma.filter((a) => nodeMatchesQuery(a, query, isEnglish)),
    [query, isEnglish],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('organograma.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setExpandSignal((v) => v + 1)}>
            {t('organograma.expandAll')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCollapseSignal((v) => v + 1)}>
            {t('organograma.collapseAll')}
          </Button>
          <Button
            variant={asciiMode ? "default" : "outline"}
            size="sm"
            onClick={() => setAsciiMode((v) => !v)}
          >
            <Code2 className="h-4 w-4 mr-1" />
            ASCII
          </Button>
        </div>
      </div>

      {asciiMode ? (
        <Card>
          <CardContent className="p-4">
            <pre className="text-xs leading-relaxed font-mono bg-muted/40 p-4 rounded-md overflow-x-auto whitespace-pre">
              {organogramaAscii}
            </pre>
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t('organograma.noAreasFound', { query })}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((area) => {
            const meta = getAreaMeta(area.key);
            const Icon = meta.icon;
            const isHighlighted = highlightedAreaKey === area.key;
            return (
              <Card
                key={area.key}
                id={`area-card-${area.key}`}
                className={cn(
                  "border-l-4 transition-all",
                  meta.ring,
                  isHighlighted && "ring-2 ring-primary shadow-lg",
                )}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", meta.tone)} />
                    {localizedField(area, 'title')}
                  </CardTitle>
                  {(area.description || area.description_en) && (
                    <p className="text-xs text-muted-foreground mt-1">{localizedField(area, 'description')}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {area.children?.map((child, i) => (
                    <OrgNode
                      key={`${child.title}-${i}`}
                      node={child}
                      depth={0}
                      query={query}
                      expandSignal={expandSignal}
                      collapseSignal={collapseSignal}
                      forceOpen={isHighlighted}
                    />
                  ))}
                  <AreaMiniTimeline areaKey={area.key} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrganogramaCards;
