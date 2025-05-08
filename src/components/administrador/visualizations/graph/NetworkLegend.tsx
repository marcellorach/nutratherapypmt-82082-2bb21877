
import React from 'react';

interface LegendItem {
  color: string;
  label: string;
}

interface NetworkLegendProps {
  items: LegendItem[];
  className?: string;
}

const NetworkLegend: React.FC<NetworkLegendProps> = ({ items, className = '' }) => {
  return (
    <div className={`flex flex-wrap gap-4 text-xs ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <div 
            className="w-3 h-3 mr-1 rounded-sm" 
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default NetworkLegend;
