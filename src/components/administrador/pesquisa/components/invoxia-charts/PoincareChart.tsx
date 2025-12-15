import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity } from 'lucide-react';

interface PetDataRow {
  date: string | null;
  [key: string]: string | number | null;
}

interface PoincareChartProps {
  data: PetDataRow[];
}

export const PoincareChart: React.FC<PoincareChartProps> = ({ data }) => {
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
      row.all_poincare_angle !== null || 
      row.all_triangular_index !== null
    ))
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return String(b.date).localeCompare(String(a.date));
    })
    .slice(0, 10)
    .reverse()
    .map(row => ({
      date: formatDate(row.date),
      poincareAngle: Number(row.all_poincare_angle) || null,
      triangularIndex: Number(row.all_triangular_index) || null,
      inAngle: Number(row.in_poincare_angle) || null,
      exAngle: Number(row.ex_poincare_angle) || null,
    }));

  // Calculate averages for display
  const validAngles = chartData.filter(d => d.poincareAngle !== null);
  const avgAngle = validAngles.length > 0 
    ? validAngles.reduce((acc, d) => acc + (d.poincareAngle || 0), 0) / validAngles.length 
    : 0;

  const validTI = chartData.filter(d => d.triangularIndex !== null);
  const avgTI = validTI.length > 0 
    ? validTI.reduce((acc, d) => acc + (d.triangularIndex || 0), 0) / validTI.length 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-violet-500" />
          {t('admin.studies.ongoingStudies.dogsData.charts.poincare.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="text-center p-2 rounded-md bg-muted/50">
            <div className="text-lg font-bold text-violet-500">
              {avgAngle.toFixed(1)}°
            </div>
            <div className="text-xs text-muted-foreground">
              {t('admin.studies.ongoingStudies.dogsData.charts.poincare.avgAngle')}
            </div>
          </div>
          <div className="text-center p-2 rounded-md bg-muted/50">
            <div className="text-lg font-bold text-emerald-500">
              {avgTI.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('admin.studies.ongoingStudies.dogsData.charts.poincare.triangularIndex')}
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 9 }} 
                className="text-muted-foreground"
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 10 }} 
                className="text-muted-foreground"
                label={{ value: '°', angle: -90, position: 'insideLeft', fontSize: 10 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10 }} 
                className="text-muted-foreground"
                label={{ value: 'TI', angle: 90, position: 'insideRight', fontSize: 10 }}
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
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="poincareAngle"
                stroke="hsl(270, 70%, 50%)"
                strokeWidth={2}
                dot={{ r: 2 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.poincare.angle')}
                connectNulls
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="inAngle"
                stroke="hsl(210, 100%, 60%)"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={{ r: 1 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.poincare.inAngle')}
                connectNulls
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="exAngle"
                stroke="hsl(0, 70%, 60%)"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={{ r: 1 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.poincare.exAngle')}
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="triangularIndex"
                stroke="hsl(142, 70%, 45%)"
                strokeWidth={2}
                dot={{ r: 2 }}
                name={t('admin.studies.ongoingStudies.dogsData.charts.poincare.triangularIndex')}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PoincareChart;
