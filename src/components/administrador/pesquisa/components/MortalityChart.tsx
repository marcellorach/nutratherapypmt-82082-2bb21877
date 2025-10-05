
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataPoint {
  age: number;
  control: number;
  treatment: number;
}

interface MortalityChartProps {
  data: DataPoint[];
  isComplete?: boolean;
}

const MortalityChart: React.FC<MortalityChartProps> = ({ data, isComplete = false }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isComplete 
            ? t('admin.studies.charts.survivalRateFinal')
            : t('admin.studies.charts.survivalRateOngoing')
          }
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="age"
                label={{ 
                  value: t('admin.studies.charts.ageInAdultPhase'), 
                  position: 'bottom',
                  offset: 0
                }}
              />
              <YAxis
                label={{ 
                  value: t('admin.studies.charts.survival'), 
                  angle: -90, 
                  position: 'insideLeft',
                  offset: 10
                }}
                domain={[0, 1]}
                tickFormatter={(value) => `${value * 100}%`}
              />
              <Tooltip 
                formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                labelFormatter={(label) => `${t('admin.studies.charts.day')} ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="control"
                stroke="#222222"
                name={t('admin.studies.charts.control')}
                strokeWidth={2}
                dot={true}
              />
              <Line
                type="monotone"
                dataKey="treatment"
                stroke="#0EA5E9"
                name={t('admin.studies.charts.treatment')}
                strokeWidth={2}
                dot={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MortalityChart;
