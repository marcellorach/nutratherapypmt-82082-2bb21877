
import React from 'react';

interface LegendItem {
  color: string;
  label: string;
  dashed?: boolean;
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
          {item.dashed ? (
            <div className="w-6 h-3 mr-1 relative">
              <div className="absolute inset-y-1/2 left-0 right-0 h-[1px] bg-current opacity-70"
                   style={{ 
                     backgroundColor: item.color,
                     backgroundImage: `linear-gradient(to right, ${item.color} 50%, transparent 50%)`,
                     backgroundSize: '6px 1px'
                   }} 
              />
            </div>
          ) : (
            <div 
              className="w-3 h-3 mr-1 rounded-sm" 
              style={{ backgroundColor: item.color }}
            />
          )}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default NetworkLegend;
