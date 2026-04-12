import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Database, Cpu, AlertTriangle, Info } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EvidenceSummary {
  tripletCount: number;
  studyCount: number;
  dominantEvidenceLevel: string;
  compoundsInvolved: string[];
  avgIntensity: number | null;
}

interface ProjectionData {
  condition: string;
  baselineScore: number;
  projectedImprovement: number;
  confidenceBand: number;
  dataSource?: 'knowledge_graph' | 'hybrid_kg_llm' | 'llm_only';
  confidenceLevel?: 'high' | 'medium' | 'low' | 'insufficient';
  evidenceSummary?: EvidenceSummary;
  studyGaps?: string;
}

interface ImprovementProjectionChartProps {
  projections: ProjectionData[];
}

const MONTHS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

const COLORS = ['hsl(142, 70%, 45%)', 'hsl(221, 70%, 55%)', 'hsl(25, 80%, 55%)', 'hsl(280, 60%, 55%)'];

const SOURCE_CONFIG = {
  knowledge_graph: { icon: Database, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', labelKey: 'petProfile.projection.sourceKG' },
  hybrid_kg_llm: { icon: Cpu, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', labelKey: 'petProfile.projection.sourceHybrid' },
  llm_only: { icon: AlertTriangle, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', labelKey: 'petProfile.projection.sourceLLM' },
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-green-600 dark:text-green-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-orange-600 dark:text-orange-400',
  insufficient: 'text-red-600 dark:text-red-400',
};

const ImprovementProjectionChart: React.FC<ImprovementProjectionChartProps> = ({ projections }) => {
  const { t } = useTranslation();

  if (!projections || projections.length === 0) return null;

  // Generate 13 data points (M0–M12) with sigmoid growth curve
  const chartData = MONTHS.map((month, i) => {
    const point: Record<string, any> = { month };
    projections.forEach((p, pIdx) => {
      const progress = i / 12;
      // Calibrate steepness based on confidence level
      const steepness = p.confidenceLevel === 'high' ? 8 : p.confidenceLevel === 'medium' ? 7 : 6;
      const sigmoid = 1 / (1 + Math.exp(-steepness * (progress - 0.4)));
      const improvement = p.projectedImprovement * sigmoid;
      const score = Math.min(100, p.baselineScore + improvement);
      const bandScale = 1 - progress * 0.3;
      const upper = Math.min(100, score + p.confidenceBand * bandScale);
      const lower = Math.max(0, score - p.confidenceBand * bandScale);

      point[`score_${pIdx}`] = Math.round(score * 10) / 10;
      point[`upper_${pIdx}`] = Math.round(upper * 10) / 10;
      point[`lower_${pIdx}`] = Math.round(lower * 10) / 10;
    });
    return point;
  });

  const chartConfig = Object.fromEntries(
    projections.map((p, i) => [
      `score_${i}`,
      { label: p.condition, color: COLORS[i % COLORS.length] },
    ])
  );

  const gapConditions = projections
    .filter(p => p.studyGaps && p.dataSource !== 'knowledge_graph')
    .map(p => p.studyGaps!);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('petProfile.projection.title')}
          </CardTitle>
          <div className="flex flex-wrap gap-1">
            {projections.map((p, i) => {
              const src = p.dataSource || 'llm_only';
              const cfg = SOURCE_CONFIG[src];
              const Icon = cfg.icon;
              return (
                <Badge key={i} variant="outline" className={`text-[10px] gap-1 ${cfg.color}`}>
                  <Icon className="h-3 w-3" />
                  {t(cfg.labelKey)}
                </Badge>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('petProfile.projection.description')}
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis domain={[0, 100]} className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            {projections.map((p, i) => (
              <React.Fragment key={i}>
                <Area
                  type="monotone"
                  dataKey={`upper_${i}`}
                  stroke="none"
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.08}
                  stackId={`band_${i}`}
                />
                <Area
                  type="monotone"
                  dataKey={`score_${i}`}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.15}
                  name={p.condition}
                />
              </React.Fragment>
            ))}
          </AreaChart>
        </ChartContainer>

        {/* Legend with evidence metadata */}
        <div className="flex flex-wrap gap-3 mt-3">
          <TooltipProvider>
            {projections.map((p, i) => {
              const confColor = CONFIDENCE_COLORS[p.confidenceLevel || 'insufficient'];
              const ev = p.evidenceSummary;
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-xs cursor-help">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span>{p.condition}</span>
                      <span className="text-muted-foreground">
                        ({p.baselineScore}% → {Math.min(100, Math.round(p.baselineScore + p.projectedImprovement))}%)
                      </span>
                      {p.confidenceLevel && (
                        <span className={`font-medium ${confColor}`}>
                          [{t(`petProfile.projection.confidence.${p.confidenceLevel}`)}]
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  {ev && (
                    <TooltipContent side="top" className="max-w-[280px] text-xs space-y-1">
                      <p className="font-semibold">{t('petProfile.projection.evidenceDetail')}</p>
                      <p>{t('petProfile.projection.triplets')}: {ev.tripletCount}</p>
                      <p>{t('petProfile.projection.studies')}: {ev.studyCount}</p>
                      <p>{t('petProfile.projection.evidenceLevel')}: {ev.dominantEvidenceLevel}</p>
                      {ev.avgIntensity !== null && (
                        <p>{t('petProfile.projection.avgIntensity')}: {Math.round(ev.avgIntensity * 100)}%</p>
                      )}
                      {ev.compoundsInvolved.length > 0 && (
                        <p>{t('petProfile.projection.compounds')}: {ev.compoundsInvolved.join(', ')}</p>
                      )}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        {/* Study gap alert */}
        {gapConditions.length > 0 && (
          <div className="mt-3 p-2 rounded-md bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 flex items-start gap-2">
            <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              {t('petProfile.projection.studyGapAlert', { conditions: gapConditions.join(', ') })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImprovementProjectionChart;
