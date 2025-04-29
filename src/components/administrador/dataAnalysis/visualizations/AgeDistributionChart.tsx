
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface AgeDistributionChartProps {
  data: Array<{
    name: string;
    value: number;
    percent: number;
  }>;
  isAbsoluteValues: boolean;
}

const AgeDistributionChart: React.FC<AgeDistributionChartProps> = ({ 
  data, 
  isAbsoluteValues 
}) => {
  // Cores personalizadas baseadas na idade (gradiente de azul para verde)
  const getBarColor = (index: number) => {
    const totalItems = data.length;
    // Começando com azul, transicionando para verde conforme a idade avança
    const r = Math.round(24 + (index / totalItems) * 16);
    const g = Math.round(119 + (index / totalItems) * 70);
    const b = Math.round(242 - (index / totalItems) * 170);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const renderTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded text-sm">
          <p className="font-medium">{`Idade: ${label} ${label === "1" ? "ano" : "anos"}`}</p>
          <p>{`Quantidade: ${data.value} pets`}</p>
          <p>{`Percentual: ${data.percent}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          tickMargin={10}
          label={{ 
            value: 'Idade (anos)', 
            position: 'insideBottom', 
            offset: -10, 
            fontSize: 12 
          }}
        />
        <YAxis 
          tickFormatter={(value) => isAbsoluteValues ? `${value}` : `${(value / data.reduce((sum, item) => sum + item.value, 0) * 100).toFixed(1)}%`}
          label={{ 
            value: isAbsoluteValues ? 'Quantidade de Pets' : 'Percentual (%)', 
            angle: -90,
            position: 'insideLeft', 
            style: { textAnchor: 'middle' },
            fontSize: 12
          }}
        />
        <Tooltip content={renderTooltip} />
        <Bar 
          dataKey={isAbsoluteValues ? 'value' : 'percent'} 
          fill="#8884d8"
          radius={[4, 4, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AgeDistributionChart;
