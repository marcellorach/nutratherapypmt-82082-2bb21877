
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

interface HealthConditionsChartProps {
  data: Array<{
    name: string;
    estudos: number;
    petlove: number;
  }>;
}

const HealthConditionsChart: React.FC<HealthConditionsChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm max-w-[200px]">
          <p className="text-sm font-medium truncate">{label}</p>
          <div className="space-y-1 mt-1">
            <p className="text-xs flex items-center">
              <span className="w-3 h-3 inline-block bg-[#9b87f5] mr-1 rounded-sm"></span> 
              <span>Estudos científicos: </span>
              <span className="font-medium ml-1">{`${payload[0].value}%`}</span>
            </p>
            <p className="text-xs flex items-center">
              <span className="w-3 h-3 inline-block bg-[#33C3F0] mr-1 rounded-sm"></span>
              <span>População PetLove: </span>
              <span className="font-medium ml-1">{`${payload[1].value}%`}</span>
            </p>
          </div>
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="w-full h-64">
      <div className="mb-2 flex justify-between items-center">
        <span className="text-sm font-medium">Eficácia por condição de saúde</span>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center">
            <span className="w-3 h-3 inline-block bg-[#9b87f5] mr-1 rounded-sm"></span>
            <span>Estudos científicos</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 inline-block bg-[#33C3F0] mr-1 rounded-sm"></span>
            <span>População PetLove</span>
          </div>
        </div>
      </div>
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
          <Bar dataKey="estudos" name="estudos" fill="#9b87f5" radius={[4, 4, 0, 0]} />
          <Bar dataKey="petlove" name="petlove" fill="#33C3F0" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HealthConditionsChart;
