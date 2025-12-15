import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, ComposedChart } from 'recharts';
import { Wind } from 'lucide-react';

interface PetDataRow {
  date: string | null;
  BR_day_mean: number | null;
  BR_night_mean: number | null;
  BR_day_min: number | null;
  BR_day_max: number | null;
  BR_night_min: number | null;
  BR_night_max: number | null;
  [key: string]: string | number | null;
}

interface BreathingRateChartProps {
  data: PetDataRow[];
}

export const BreathingRateChart: React.FC<BreathingRateChartProps> = ({ data }) => {
  const { t } = useTranslation();

  const chartData = data
    .filter(row => row.date && (row.BR_day_mean || row.BR_night_mean))
    .slice(0, 30)
    .reverse()
    .map(row => ({
      date: row.date?.split('-').slice(1).join('/') || '',
      dayMean: row.BR_day_mean,
      nightMean: row.BR_night_mean,
      dayMin: row.BR_day_min,
      dayMax: row.BR_day_max,
      nightMin: row.BR_night_min,
      nightMax: row.BR_night_max,
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wind className="h-4 w-4 text-emerald-500" />
          {t('admin.studies.ongoingStudies.dogsData.charts.breathingRate.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }} 
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                domain={['auto', 'auto']}
                className="text-muted-foreground"
                label={{ value: 'RPM', angle: -90, position: 'insideLeft', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area
                type="monotone"
                dataKey="dayMax"
                fill="hsl(160, 60%, 90%)"
                stroke="none"
                name={t('admin.studies.ongoingStudies.dogsData.charts.breathingRate.dayMax')}
              />
              <Area
                type="monotone"
                dataKey="dayMin"
                fill="hsl(var(--card))"
                stroke="none"
                name={t('admin.studies.ongoingStudies.dogsData.charts.breathingRate.dayMin')}
              />
              <Line
                type="monotone"
                dataKey="dayMean"
                stroke="hsl(160, 60%, 45%)"
                strokeWidth={2}
                dot={{ r: 2 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.breathingRate.dayMean')}
              />
              <Line
                type="monotone"
                dataKey="nightMean"
                stroke="hsl(180, 60%, 40%)"
                strokeWidth={2}
                dot={{ r: 2 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.breathingRate.nightMean')}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default BreathingRateChart;
