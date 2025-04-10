
import React from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

interface PopulationChartProps {
  efficacyScore: number;
  condition: string;
}

const PopulationChart: React.FC<PopulationChartProps> = ({ efficacyScore, condition }) => {
  // Dados simulados para comparação
  const data = [
    {
      name: 'Estudos científicos',
      eficácia: efficacyScore * 20, // Convertendo escala 0-5 para 0-100
    },
    {
      name: 'Todos pacientes',
      eficácia: Math.min(100, Math.round((efficacyScore * 20) * (1 + Math.random() * 0.2 - 0.1))),
    },
    {
      name: 'Mesma raça',
      eficácia: Math.min(100, Math.round((efficacyScore * 20) * (1 + Math.random() * 0.3))),
    },
    {
      name: 'Mesmo peso',
      eficácia: Math.min(100, Math.round((efficacyScore * 20) * (1 + Math.random() * 0.2 - 0.05))),
    },
  ];

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-gray-600">
            Eficácia: <span className="font-medium">{`${payload[0].value}%`}</span>
          </p>
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 10,
            bottom: 30,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="eficácia" fill="#9b87f5">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 2 ? "#7E69AB" : "#9b87f5"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-center text-gray-500 mt-2">
        Eficácia comparativa para {condition}
      </p>
    </div>
  );
};

export default PopulationChart;
