import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line } from 'recharts';
import { Footprints } from 'lucide-react';

interface PetDataRow {
  date: string | null;
  distance: number | null;
  calories: number | null;
  exercise_duration_minutes: number | null;
  [key: string]: string | number | null;
}

interface ActivityChartProps {
  data: PetDataRow[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
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
    .filter(row => row.date && row.distance !== null)
    .slice(0, 30)
    .reverse()
    .map(row => ({
      date: formatDate(row.date),
      distance: row.distance,
      calories: row.calories,
      exerciseMinutes: row.exercise_duration_minutes,
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Footprints className="h-4 w-4 text-blue-500" />
          {t('admin.studies.ongoingStudies.dogsData.charts.activity.title')}
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
                yAxisId="left"
                tick={{ fontSize: 10 }} 
                domain={['auto', 'auto']}
                className="text-muted-foreground"
                label={{ value: 'm', angle: -90, position: 'insideLeft', fontSize: 10 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10 }} 
                domain={['auto', 'auto']}
                className="text-muted-foreground"
                label={{ value: 'min', angle: 90, position: 'insideRight', fontSize: 10 }}
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
              <Bar
                yAxisId="left"
                dataKey="distance"
                fill="hsl(210, 80%, 60%)"
                radius={[4, 4, 0, 0]}
                name={t('admin.studies.ongoingStudies.dogsData.charts.activity.distance')}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="exerciseMinutes"
                stroke="hsl(340, 80%, 55%)"
                strokeWidth={2}
                dot={{ r: 2 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.activity.exerciseMinutes')}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="calories"
                stroke="hsl(30, 90%, 55%)"
                strokeWidth={2}
                dot={{ r: 2 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.activity.calories')}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityChart;
