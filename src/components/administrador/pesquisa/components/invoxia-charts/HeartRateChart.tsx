import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, ComposedChart } from 'recharts';
import { Heart } from 'lucide-react';

interface PetDataRow {
  date: string | null;
  HR_day_mean: number | null;
  HR_night_mean: number | null;
  HR_day_min: number | null;
  HR_day_max: number | null;
  HR_night_min: number | null;
  HR_night_max: number | null;
  [key: string]: string | number | null;
}

interface HeartRateChartProps {
  data: PetDataRow[];
}

export const HeartRateChart: React.FC<HeartRateChartProps> = ({ data }) => {
  const { t } = useTranslation();

  const formatDate = (date: string | number | null): string => {
    if (!date) return '';
    const dateStr = String(date);
    if (dateStr.includes('-')) {
      return dateStr.split('-').slice(1).join('/');
    }
    return dateStr.slice(0, 10);
  };

  const chartData = data
    .filter(row => row.date && (row.HR_day_mean || row.HR_night_mean))
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return String(b.date).localeCompare(String(a.date));
    })
    .slice(0, 10)
    .reverse()
    .map(row => ({
      date: formatDate(row.date),
      dayMean: row.HR_day_mean,
      nightMean: row.HR_night_mean,
      dayMin: row.HR_day_min,
      dayMax: row.HR_day_max,
      nightMin: row.HR_night_min,
      nightMax: row.HR_night_max,
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-500" />
          {t('admin.studies.ongoingStudies.dogsData.charts.heartRate.title')}
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
                label={{ value: 'BPM', angle: -90, position: 'insideLeft', fontSize: 10 }}
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
                fill="hsl(210, 100%, 90%)"
                stroke="none"
                name={t('admin.studies.ongoingStudies.dogsData.charts.heartRate.dayMax')}
              />
              <Area
                type="monotone"
                dataKey="dayMin"
                fill="hsl(var(--card))"
                stroke="none"
                name={t('admin.studies.ongoingStudies.dogsData.charts.heartRate.dayMin')}
              />
              <Line
                type="monotone"
                dataKey="dayMean"
                stroke="hsl(210, 100%, 50%)"
                strokeWidth={2}
                dot={{ r: 2 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.heartRate.dayMean')}
              />
              <Line
                type="monotone"
                dataKey="nightMean"
                stroke="hsl(270, 70%, 50%)"
                strokeWidth={2}
                dot={{ r: 2 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.heartRate.nightMean')}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeartRateChart;
