
import React from 'react';
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isComplete ? "Taxa de Sobrevivência Final" : "Taxa de Sobrevivência (Em Andamento)"}
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
                  value: 'Idade na fase adulta (dias)', 
                  position: 'bottom',
                  offset: 0
                }}
              />
              <YAxis
                label={{ 
                  value: 'Sobrevivência', 
                  angle: -90, 
                  position: 'insideLeft',
                  offset: 10
                }}
                domain={[0, 1]}
                tickFormatter={(value) => `${value * 100}%`}
              />
              <Tooltip 
                formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                labelFormatter={(label) => `Dia ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="control"
                stroke="#222222"
                name="Controle"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="treatment"
                stroke="#0EA5E9"
                name="Tratamento"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MortalityChart;
