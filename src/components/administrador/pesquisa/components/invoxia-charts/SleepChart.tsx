import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line, ReferenceLine } from 'recharts';
import { Moon } from 'lucide-react';

interface PetDataRow {
  date: string | null;
  night_sleep_duration_hours: number | null;
  sleep_score: number | null;
  [key: string]: string | number | null;
}

interface SleepChartProps {
  data: PetDataRow[];
}

export const SleepChart: React.FC<SleepChartProps> = ({ data }) => {
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
    .filter(row => row.date && (row.night_sleep_duration_hours !== null || row.sleep_score !== null))
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return String(b.date).localeCompare(String(a.date));
    })
    .slice(0, 10)
    .reverse()
    .map(row => ({
      date: formatDate(row.date),
      sleepHours: row.night_sleep_duration_hours,
      sleepScore: row.sleep_score,
    }));

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Moon className="h-4 w-4 text-indigo-500" />
          {t('admin.studies.ongoingStudies.dogsData.charts.sleep.title')}
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
                domain={[0, 'auto']}
                className="text-muted-foreground"
                label={{ value: 'h', angle: -90, position: 'insideLeft', fontSize: 10 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10 }} 
                domain={[0, 100]}
                className="text-muted-foreground"
                label={{ value: '%', angle: 90, position: 'insideRight', fontSize: 10 }}
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
              <ReferenceLine 
                yAxisId="left"
                y={8} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3"
                label={{ value: t('admin.studies.ongoingStudies.dogsData.charts.sleep.target'), position: 'left', fontSize: 9 }}
              />
              <Bar
                yAxisId="left"
                dataKey="sleepHours"
                fill="hsl(240, 60%, 65%)"
                radius={[4, 4, 0, 0]}
                name={t('admin.studies.ongoingStudies.dogsData.charts.sleep.hours')}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sleepScore"
                stroke="hsl(280, 70%, 55%)"
                strokeWidth={2}
                dot={{ r: 2 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.sleep.score')}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SleepChart;
