import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity } from 'lucide-react';

interface PetDataRow {
  date: string | null;
  all_sdnn: number | null;
  all_rmssd: number | null;
  all_hrv: number | null;
  day_sdnn: number | null;
  night_sdnn: number | null;
  [key: string]: string | number | null;
}

interface HRVChartProps {
  data: PetDataRow[];
}

export const HRVChart: React.FC<HRVChartProps> = ({ data }) => {
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
    .filter(row => row.date && (row.all_sdnn || row.all_rmssd || row.all_hrv))
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return String(b.date).localeCompare(String(a.date));
    })
    .slice(0, 10)
    .reverse()
    .map(row => ({
      date: formatDate(row.date),
      sdnn: row.all_sdnn,
      rmssd: row.all_rmssd,
      hrv: row.all_hrv,
      daySdnn: row.day_sdnn,
      nightSdnn: row.night_sdnn,
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-amber-500" />
          {t('admin.studies.ongoingStudies.dogsData.charts.hrv.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                label={{ value: 'ms', angle: -90, position: 'insideLeft', fontSize: 10 }}
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
              <Line
                type="monotone"
                dataKey="sdnn"
                stroke="hsl(40, 90%, 50%)"
                strokeWidth={2}
                dot={{ r: 2 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.hrv.sdnn')}
              />
              <Line
                type="monotone"
                dataKey="rmssd"
                stroke="hsl(20, 90%, 50%)"
                strokeWidth={2}
                dot={{ r: 2 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.hrv.rmssd')}
              />
              <Line
                type="monotone"
                dataKey="daySdnn"
                stroke="hsl(45, 70%, 60%)"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={{ r: 1 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.hrv.daySdnn')}
              />
              <Line
                type="monotone"
                dataKey="nightSdnn"
                stroke="hsl(280, 70%, 50%)"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={{ r: 1 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.hrv.nightSdnn')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default HRVChart;
