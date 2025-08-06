
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DataPoint {
  label: string;
  control: number;
  treatment: number;
}

interface PartialResultsChartProps {
  title: string;
  data: DataPoint[];
  description?: string;
  yAxisLabel?: string;
  chartType?: 'line' | 'bar';
  formatter?: (value: number) => string;
}

const PartialResultsChart: React.FC<PartialResultsChartProps> = ({
  title,
  data,
  description,
  yAxisLabel = '',
  chartType = 'line',
  formatter = (value) => `${value}`
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number) => formatter(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="control"
                  stroke="#9CA3AF"
                  name="Controle"
                  strokeWidth={2}
                  dot={true}
                />
                <Line
                  type="monotone"
                  dataKey="treatment"
                  stroke="#3B82F6"
                  name="Dapa"
                  strokeWidth={2}
                  dot={true}
                />
              </LineChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number) => formatter(value)} />
                <Legend />
                <Bar dataKey="control" name="Controle" fill="#9CA3AF" />
                <Bar dataKey="treatment" name="Dapa" fill="#3B82F6" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartialResultsChart;
