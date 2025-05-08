
import React, { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  Sector
} from 'recharts';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BreedDistributionProps {
  data: Array<{
    name: string;
    value: number;
    percent: number;
  }>;
  onBackClick: () => void;
  colors: string[];
  hoverColors: string[];
  onPieClick?: (data: any) => void;
  showPieDetails?: boolean;
}

const BreedDistribution: React.FC<BreedDistributionProps> = ({ 
  data, 
  onBackClick,
  colors,
  hoverColors,
  onPieClick,
  showPieDetails = false
}) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };
  
  const handlePieClick = (data: any) => {
    if (onPieClick) {
      onPieClick(data);
    }
  };

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
    
    return (
      <g>
        <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#333" fontSize={14} fontWeight={600}>
          {payload.name}
        </text>
        <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="#333" fontSize={12}>
          {value} pets
        </text>
        <text x={cx} y={cy + 30} dy={8} textAnchor="middle" fill="#666" fontSize={12}>
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className="h-full">
      <div className="mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBackClick}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Espécies
        </Button>
      </div>
      
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={110}
            fill="#8884d8"
            dataKey="value"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            onClick={showPieDetails ? handlePieClick : undefined}
            isAnimationActive={true}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={activeIndex === index ? hoverColors[index % hoverColors.length] : colors[index % colors.length]} 
                strokeWidth={activeIndex === index ? 2 : 1}
                stroke="#fff"
              />
            ))}
          </Pie>
          <Legend 
            verticalAlign="bottom" 
            align="center"
            layout="horizontal"
            formatter={(value, entry, index) => (
              <span style={{ color: '#333', cursor: showPieDetails ? 'pointer' : 'default' }}>
                {value} ({data[index].percent}%)
              </span>
            )}
          />
          <Tooltip 
            formatter={(value: number, name: string, props: any) => {
              return [`${value} pets (${props.payload.percent}%)`, name];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BreedDistribution;
