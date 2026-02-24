import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DataPoint {
  label: string;
  control: number;
  dapagliflozin?: number;
  empagliflozin?: number;
  treatment?: number;
}

interface StatisticalInfo {
  pValue: string;
  hazardRatio: string;
  riskReduction: string;
}

interface PartialResultsChartProps {
  title: string;
  data: DataPoint[];
  description?: string;
  yAxisLabel?: string;
  chartType?: 'line' | 'bar';
  formatter?: (value: number) => string;
  statisticalInfo?: StatisticalInfo;
}

const PartialResultsChart: React.FC<PartialResultsChartProps> = ({
  title,
  data,
  description,
  yAxisLabel = '',
  chartType = 'line',
  formatter = (value) => `${value}`,
  statisticalInfo
}) => {
  const { t } = useTranslation();

  return (
    <Card className="border-l-4 border-l-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          {title}
          {statisticalInfo && (
            <span className="text-xs font-normal px-2 py-1 bg-primary/10 text-primary rounded-md">
              {statisticalInfo.pValue}
            </span>
          )}
        </CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {statisticalInfo && (
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2">
            <span className="font-medium">{statisticalInfo.hazardRatio}</span>
            <span className="text-green-600 font-medium">{statisticalInfo.riskReduction}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart
                data={data}
                margin={{ top: 15, right: 30, left: 25, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  label={{ 
                    value: yAxisLabel, 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' }
                  }}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatter(value), '']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '10px',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="control"
                  stroke="hsl(var(--muted-foreground))"
                  name={t('partialResultsChart.control')}
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 }}
                  strokeDasharray="5 5"
                />
                {data[0]?.dapagliflozin !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="dapagliflozin"
                    stroke="hsl(var(--primary))"
                    name={t('partialResultsChart.dapagliflozin')}
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                  />
                )}
                {data[0]?.empagliflozin !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="empagliflozin"
                    stroke="#ea580c"
                    name={t('partialResultsChart.empagliflozin')}
                    strokeWidth={3}
                    dot={{ fill: '#ea580c', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#ea580c', strokeWidth: 2 }}
                  />
                )}
                {data[0]?.treatment !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="treatment"
                    stroke="hsl(var(--primary))"
                    name={t('partialResultsChart.treatment')}
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                  />
                )}
              </LineChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 15, right: 30, left: 25, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  label={{ 
                    value: yAxisLabel, 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' }
                  }}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatter(value), '']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '10px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="control" name={t('partialResultsChart.control')} fill="hsl(var(--muted))" />
                {data[0]?.dapagliflozin !== undefined && <Bar dataKey="dapagliflozin" name={t('partialResultsChart.dapagliflozin')} fill="hsl(var(--primary))" />}
                {data[0]?.empagliflozin !== undefined && <Bar dataKey="empagliflozin" name={t('partialResultsChart.empagliflozin')} fill="#ea580c" />}
                {data[0]?.treatment !== undefined && <Bar dataKey="treatment" name={t('partialResultsChart.treatment')} fill="hsl(var(--primary))" />}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartialResultsChart;
