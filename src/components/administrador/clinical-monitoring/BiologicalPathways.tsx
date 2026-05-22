import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { BIOLOGICAL_PATHWAYS, getPathway, PathwayNode, EdgeKind } from '@/data/biologicalPathways';
import { SYNTHETIC_CONDITIONS, SyntheticCohort } from '@/utils/syntheticCohort';

interface Props { cohort: SyntheticCohort; }

const TIER_X: Record<PathwayNode['tier'], number> = { compound: 80, mechanism: 320, process: 560, outcome: 800 };
const TIER_COLOR: Record<PathwayNode['tier'], string> = {
  compound: 'hsl(var(--primary))',
  mechanism: '#8b5cf6',
  process: '#f59e0b',
  outcome: '#10b981',
};
const KIND_GLYPH: Record<EdgeKind, string> = { activates: '→', inhibits: '⊣', modulates: '⇢' };
const KIND_DASH: Record<EdgeKind, string> = { activates: '', inhibits: '6 3', modulates: '2 3' };

const BiologicalPathways: React.FC<Props> = ({ cohort }) => {
  const { t, i18n } = useTranslation();
  const [conditionId, setConditionId] = useState<string>(BIOLOGICAL_PATHWAYS[0].conditionId);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const pathway = getPathway(conditionId);
  const cond = SYNTHETIC_CONDITIONS.find((c) => c.id === conditionId);

  const stats = useMemo(() => {
    const treated = cohort.treated.filter((p) => p.primaryConditionId === conditionId);
    const n = treated.length;
    const meanDelta = n
      ? treated.reduce((s, p) => s + (p.monthlySeverity[p.monthlySeverity.length - 1] - p.severityT0), 0) / n
      : 0;
    return { n, deltaPct: (meanDelta * 100).toFixed(1) };
  }, [cohort, conditionId]);

  const layout = useMemo(() => {
    if (!pathway) return null;
    const tiers: Record<PathwayNode['tier'], PathwayNode[]> = { compound: [], mechanism: [], process: [], outcome: [] };
    pathway.nodes.forEach((n) => tiers[n.tier].push(n));
    const positions = new Map<string, { x: number; y: number }>();
    (Object.keys(tiers) as PathwayNode['tier'][]).forEach((tier) => {
      const arr = tiers[tier];
      const slotH = 80;
      const startY = 60 + (4 - arr.length) * (slotH / 2);
      arr.forEach((node, i) => positions.set(node.id, { x: TIER_X[tier], y: startY + i * slotH }));
    });
    return positions;
  }, [pathway]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-amber-800 dark:text-amber-200">{t('clinicalMonitoring.v2.pathways.warning')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
          <div>
            <CardTitle className="text-base">{t('clinicalMonitoring.v2.pathways.title')}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{t('clinicalMonitoring.v2.pathways.subtitle')}</p>
          </div>
          <Select value={conditionId} onValueChange={setConditionId}>
            <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BIOLOGICAL_PATHWAYS.map((p) => {
                const c = SYNTHETIC_CONDITIONS.find((x) => x.id === p.conditionId)!;
                return <SelectItem key={p.conditionId} value={p.conditionId}>{i18n.language === 'en' ? c.name_en : c.name}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline">{t('clinicalMonitoring.v2.pathways.evidence', { n: stats.n.toLocaleString() })}</Badge>
            <Badge variant="outline">{t('clinicalMonitoring.v2.pathways.deltaAvg', { delta: stats.deltaPct + 'pp' })}</Badge>
            <span className="text-xs text-muted-foreground ml-auto">{t('clinicalMonitoring.v2.pathways.legend')}</span>
          </div>

          {!pathway || !layout ? (
            <p className="text-sm text-muted-foreground italic">{t('clinicalMonitoring.v2.pathways.noPath')}</p>
          ) : (
            <div className="overflow-x-auto">
              <svg viewBox="0 0 900 420" className="w-full" style={{ minWidth: 760 }}>
                <defs>
                  <marker id="arrow-activate" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--foreground))" opacity="0.6" />
                  </marker>
                  <marker id="arrow-inhibit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
                    <path d="M 9 0 L 9 10" stroke="hsl(var(--destructive))" strokeWidth="2" />
                  </marker>
                  <marker id="arrow-modulate" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                    <circle cx="5" cy="5" r="3" fill="#8b5cf6" />
                  </marker>
                </defs>

                {/* tier headers */}
                {(['compound', 'mechanism', 'process', 'outcome'] as const).map((tier) => (
                  <text key={tier} x={TIER_X[tier]} y={28} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))" fontWeight="600">
                    {tier.toUpperCase()}
                  </text>
                ))}

                {/* edges */}
                {pathway.edges.map((e, i) => {
                  const a = layout.get(e.from); const b = layout.get(e.to);
                  if (!a || !b) return null;
                  const stroke = e.kind === 'inhibits' ? 'hsl(var(--destructive))' : e.kind === 'modulates' ? '#8b5cf6' : 'hsl(var(--foreground))';
                  const width = 1 + e.evidence * 4;
                  const dim = hoveredNode && hoveredNode !== e.from && hoveredNode !== e.to;
                  return (
                    <line
                      key={i}
                      x1={a.x + 60} y1={a.y} x2={b.x - 60} y2={b.y}
                      stroke={stroke}
                      strokeWidth={width}
                      strokeDasharray={KIND_DASH[e.kind]}
                      opacity={dim ? 0.15 : 0.7}
                      markerEnd={`url(#arrow-${e.kind === 'activates' ? 'activate' : e.kind === 'inhibits' ? 'inhibit' : 'modulate'})`}
                    >
                      <title>{`${KIND_GLYPH[e.kind]} evidência sintética: ${(e.evidence * 100).toFixed(0)}%`}</title>
                    </line>
                  );
                })}

                {/* nodes */}
                {pathway.nodes.map((n) => {
                  const pos = layout.get(n.id)!;
                  const isHover = hoveredNode === n.id;
                  const label = i18n.language === 'en' ? n.label_en : n.label;
                  return (
                    <g key={n.id} onMouseEnter={() => setHoveredNode(n.id)} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
                      <rect
                        x={pos.x - 60} y={pos.y - 18} width={120} height={36} rx={8}
                        fill={TIER_COLOR[n.tier]}
                        fillOpacity={isHover ? 0.25 : 0.12}
                        stroke={TIER_COLOR[n.tier]}
                        strokeWidth={isHover ? 2 : 1.2}
                      />
                      <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))" fontWeight="500">
                        {label.length > 18 ? label.slice(0, 17) + '…' : label}
                      </text>
                      <title>{label}</title>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
          {cond && (
            <p className="text-xs text-muted-foreground mt-3 italic">
              {i18n.language === 'en' ? cond.name_en : cond.name} · {stats.n.toLocaleString()} pets · platô esperado M{cond.plateauMonths}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BiologicalPathways;