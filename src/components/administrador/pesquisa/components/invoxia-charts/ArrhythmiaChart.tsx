import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { AlertTriangle } from 'lucide-react';

interface PetDataRow {
  date: string | null;
  [key: string]: string | number | null;
}

interface ArrhythmiaChartProps {
  data: PetDataRow[];
}

export const ArrhythmiaChart: React.FC<ArrhythmiaChartProps> = ({ data }) => {
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
    .filter(row => row.date && (
      row.all_tachy_count !== null || 
      row.all_brady_count !== null ||
      row.all_cardiac_pause_count_2 !== null
    ))
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return String(b.date).localeCompare(String(a.date));
    })
    .slice(0, 10)
    .reverse()
    .map(row => ({
      date: formatDate(row.date),
      tachycardia: Number(row.all_tachy_count) || 0,
      bradycardia: Number(row.all_brady_count) || 0,
      pauses2s: Number(row.all_cardiac_pause_count_2) || 0,
      pauses3s: Number(row.all_cardiac_pause_count_3) || 0,
      pauses4s: Number(row.all_cardiac_pause_count_4) || 0,
      pauses5s: Number(row.all_cardiac_pause_count_5) || 0,
    }));

  // Summary data for the current period
  const totalTachy = chartData.reduce((acc, row) => acc + row.tachycardia, 0);
  const totalBrady = chartData.reduce((acc, row) => acc + row.bradycardia, 0);
  const totalPauses = chartData.reduce((acc, row) => 
    acc + row.pauses2s + row.pauses3s + row.pauses4s + row.pauses5s, 0
  );

  const getStatusColor = (value: number, type: 'tachy' | 'brady' | 'pause') => {
    if (value === 0) return 'hsl(142, 76%, 36%)'; // green
    if (type === 'pause' && value > 3) return 'hsl(0, 84%, 60%)'; // red
    if (value > 5) return 'hsl(0, 84%, 60%)'; // red
    return 'hsl(38, 92%, 50%)'; // yellow/warning
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {t('admin.studies.ongoingStudies.dogsData.charts.arrhythmia.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-md bg-muted/50">
            <div 
              className="text-lg font-bold"
              style={{ color: getStatusColor(totalTachy, 'tachy') }}
            >
              {totalTachy}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('admin.studies.ongoingStudies.dogsData.charts.arrhythmia.tachycardia')}
            </div>
          </div>
          <div className="text-center p-2 rounded-md bg-muted/50">
            <div 
              className="text-lg font-bold"
              style={{ color: getStatusColor(totalBrady, 'brady') }}
            >
              {totalBrady}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('admin.studies.ongoingStudies.dogsData.charts.arrhythmia.bradycardia')}
            </div>
          </div>
          <div className="text-center p-2 rounded-md bg-muted/50">
            <div 
              className="text-lg font-bold"
              style={{ color: getStatusColor(totalPauses, 'pause') }}
            >
              {totalPauses}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('admin.studies.ongoingStudies.dogsData.charts.arrhythmia.pauses')}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 9 }} 
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar
                dataKey="tachycardia"
                fill="hsl(0, 84%, 60%)"
                name={t('admin.studies.ongoingStudies.dogsData.charts.arrhythmia.tachycardia')}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="bradycardia"
                fill="hsl(210, 100%, 50%)"
                name={t('admin.studies.ongoingStudies.dogsData.charts.arrhythmia.bradycardia')}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="pauses2s"
                fill="hsl(38, 92%, 50%)"
                name={t('admin.studies.ongoingStudies.dogsData.charts.arrhythmia.pauses2s')}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArrhythmiaChart;
