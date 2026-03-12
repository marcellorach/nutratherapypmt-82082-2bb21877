import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingDown, TrendingUp, TestTube } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceDot } from 'recharts';

interface ConditionData {
  name: string;
  condition_name?: string;
  severity?: string;
  baselineScore?: number;
}

interface Props {
  conditions: ConditionData[];
}

const MONTHS = Array.from({ length: 13 }, (_, i) => i);

// Generate sigmoid-based progression data for a condition
function generateProgressionData(condition: ConditionData) {
  const baseline = condition.baselineScore || getBaselineFromSeverity(condition.severity);
  
  return MONTHS.map((month) => {
    const t = month / 12;
    
    // WITHOUT treatment: gradual decline (worsening)
    const declineRate = baseline > 60 ? 0.15 : 0.25;
    const withoutTreatment = Math.max(5, baseline - (baseline * declineRate * t) - (Math.pow(t, 1.5) * 8));
    
    // WITH treatment: sigmoid improvement curve
    const sigmoid = 1 / (1 + Math.exp(-8 * (t - 0.35)));
    const maxImprovement = Math.min(35, (100 - baseline) * 0.7);
    const withTreatment = Math.min(100, baseline + maxImprovement * sigmoid);
    
    // Confidence bands
    const bandWidth = 8 * (1 - t * 0.3);
    
    return {
      month: `M${month}`,
      monthNum: month,
      withTreatment: Math.round(withTreatment * 10) / 10,
      withoutTreatment: Math.round(withoutTreatment * 10) / 10,
      upperBand: Math.round(Math.min(100, withTreatment + bandWidth) * 10) / 10,
      lowerBand: Math.round(Math.max(0, withTreatment - bandWidth) * 10) / 10,
    };
  });
}

function getBaselineFromSeverity(severity?: string): number {
  switch (severity) {
    case 'severe': return 35;
    case 'moderate': return 55;
    case 'mild': return 72;
    default: return 55;
  }
}

// Custom dot for exam calibration points
const ExamDot = (props: any) => {
  const { cx, cy, payload } = props;
  const isExamPoint = payload?.monthNum === 0 || payload?.monthNum === 11;
  if (!isExamPoint || !cx || !cy) return null;
  
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="hsl(var(--primary))" opacity={0.2} />
      <circle cx={cx} cy={cy} r={5} fill="hsl(var(--primary))" stroke="white" strokeWidth={2} />
      <text x={cx} y={cy - 14} textAnchor="middle" fill="hsl(var(--primary))" fontSize={9} fontWeight="bold">
        {payload.monthNum === 0 ? '🔬' : '🔬'}
      </text>
    </g>
  );
};

const ConditionProgressionChart: React.FC<Props> = ({ conditions }) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!conditions || conditions.length === 0) return null;

  const current = conditions[selectedIndex] || conditions[0];
  const data = generateProgressionData(current);
  const baseline = current.baselineScore || getBaselineFromSeverity(current.severity);
  const projected = data[12]?.withTreatment || baseline;
  const withoutEnd = data[12]?.withoutTreatment || baseline;

  const chartConfig = {
    withTreatment: { 
      label: t('tutor.proposal.progression.withTreatment'), 
      color: 'hsl(142, 70%, 45%)' 
    },
    withoutTreatment: { 
      label: t('tutor.proposal.progression.withoutTreatment'), 
      color: 'hsl(0, 70%, 55%)' 
    },
    upperBand: { label: '', color: 'hsl(142, 70%, 45%)' },
    lowerBand: { label: '', color: 'hsl(142, 70%, 45%)' },
  };

  return (
    <div>
      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        {t('tutor.proposal.progression.title')}
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        {t('tutor.proposal.progression.description')}
      </p>

      {/* Condition selector */}
      {conditions.length > 1 && (
        <Select
          value={String(selectedIndex)}
          onValueChange={(v) => setSelectedIndex(Number(v))}
        >
          <SelectTrigger className="w-full mb-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {conditions.map((c, i) => (
              <SelectItem key={i} value={String(i)}>
                {c.name || c.condition_name || `${t('tutor.proposal.progression.condition')} ${i + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Condition name when single */}
      {conditions.length === 1 && (
        <p className="text-sm font-medium text-foreground mb-2">
          {current.name || (current as any).condition_name}
        </p>
      )}

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="outline" className="text-xs gap-1">
          <TestTube className="h-3 w-3" />
          {t('tutor.proposal.progression.baseline')}: {Math.round(baseline)}%
        </Badge>
        <Badge className="text-xs gap-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200">
          <TrendingUp className="h-3 w-3" />
          {t('tutor.proposal.progression.projectedWith')}: {Math.round(projected)}%
        </Badge>
        <Badge className="text-xs gap-1 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200">
          <TrendingDown className="h-3 w-3" />
          {t('tutor.proposal.progression.projectedWithout')}: {Math.round(withoutEnd)}%
        </Badge>
      </div>

      {/* Chart */}
      <Card className="border">
        <CardContent className="p-2 pt-4">
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-[10px]" 
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                domain={[0, 100]} 
                className="text-[10px]" 
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${v}%`}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />} 
              />
              
              {/* Exam calibration reference lines */}
              <ReferenceLine 
                x="M0" 
                stroke="hsl(var(--primary))" 
                strokeDasharray="4 4" 
                strokeWidth={1.5}
                label={{ value: t('tutor.proposal.progression.examBaseline'), position: 'top', fontSize: 9, fill: 'hsl(var(--primary))' }}
              />
              <ReferenceLine 
                x="M11" 
                stroke="hsl(var(--primary))" 
                strokeDasharray="4 4" 
                strokeWidth={1.5}
                label={{ value: t('tutor.proposal.progression.examCalibration'), position: 'top', fontSize: 9, fill: 'hsl(var(--primary))' }}
              />

              {/* Confidence band */}
              <Area
                type="monotone"
                dataKey="upperBand"
                stroke="none"
                fill="hsl(142, 70%, 45%)"
                fillOpacity={0.06}
              />
              <Area
                type="monotone"
                dataKey="lowerBand"
                stroke="none"
                fill="white"
                fillOpacity={0}
              />

              {/* Without treatment (declining) */}
              <Area
                type="monotone"
                dataKey="withoutTreatment"
                stroke="hsl(0, 70%, 55%)"
                strokeWidth={2}
                strokeDasharray="6 3"
                fill="hsl(0, 70%, 55%)"
                fillOpacity={0.05}
                name={t('tutor.proposal.progression.withoutTreatment')}
              />

              {/* With treatment (improving) */}
              <Area
                type="monotone"
                dataKey="withTreatment"
                stroke="hsl(142, 70%, 45%)"
                strokeWidth={2.5}
                fill="hsl(142, 70%, 45%)"
                fillOpacity={0.12}
                name={t('tutor.proposal.progression.withTreatment')}
                dot={ExamDot}
              />

              {/* Exam calibration dots */}
              <ReferenceDot
                x="M0"
                y={data[0]?.withTreatment}
                r={6}
                fill="hsl(var(--primary))"
                stroke="white"
                strokeWidth={2}
              />
              <ReferenceDot
                x="M11"
                y={data[11]?.withTreatment}
                r={6}
                fill="hsl(var(--primary))"
                stroke="white"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-green-500 rounded" />
              {t('tutor.proposal.progression.withTreatment')}
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-red-500 rounded border-dashed" style={{ borderTop: '2px dashed hsl(0, 70%, 55%)' , height: 0 }} />
              {t('tutor.proposal.progression.withoutTreatment')}
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              {t('tutor.proposal.progression.examPoints')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConditionProgressionChart;
