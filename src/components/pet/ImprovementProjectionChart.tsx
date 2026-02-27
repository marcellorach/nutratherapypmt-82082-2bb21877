import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ProjectionData {
  condition: string;
  baselineScore: number; // 0-100
  projectedImprovement: number; // percentage points gained over 12 months
  confidenceBand: number; // +/- percentage points
}

interface ImprovementProjectionChartProps {
  projections: ProjectionData[];
}

const MONTHS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

const COLORS = ['hsl(142, 70%, 45%)', 'hsl(221, 70%, 55%)', 'hsl(25, 80%, 55%)', 'hsl(280, 60%, 55%)'];

const ImprovementProjectionChart: React.FC<ImprovementProjectionChartProps> = ({ projections }) => {
  const { t } = useTranslation();

  if (!projections || projections.length === 0) return null;

  // Generate 13 data points (M0–M12) with sigmoid growth curve
  const chartData = MONTHS.map((month, i) => {
    const point: Record<string, any> = { month };
    projections.forEach((p, pIdx) => {
      // Sigmoid-like growth: slow start, accelerating, then plateauing
      const progress = i / 12;
      const sigmoid = 1 / (1 + Math.exp(-8 * (progress - 0.4)));
      const improvement = p.projectedImprovement * sigmoid;
      const score = Math.min(100, p.baselineScore + improvement);
      const upper = Math.min(100, score + p.confidenceBand * (1 - progress * 0.3));
      const lower = Math.max(0, score - p.confidenceBand * (1 - progress * 0.3));
      
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {t('petProfile.projection.title')}
        </CardTitle>
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
        <div className="flex flex-wrap gap-3 mt-3">
          {projections.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span>{p.condition}</span>
              <span className="text-muted-foreground">
                ({p.baselineScore}% → {Math.min(100, Math.round(p.baselineScore + p.projectedImprovement))}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovementProjectionChart;
