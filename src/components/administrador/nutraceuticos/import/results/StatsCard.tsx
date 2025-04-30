
import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  description: string;
  color?: 'purple' | 'green' | 'blue' | 'amber';
  icon?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  description, 
  color = 'purple',
  icon
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'bg-green-50 text-green-700 ring-green-600/20';
      case 'blue':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'amber':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20';
      case 'purple':
      default:
        return 'bg-purple-50 text-purple-700 ring-purple-600/20';
    }
  };

  return (
    <div className={`rounded-lg p-6 ring-1 ring-inset ${getColorClasses()} hover:shadow-md transition-all`}>
      <div className="flex items-center">
        {icon && <div className="mr-3">{icon}</div>}
        <div>
          <div className="text-sm font-medium uppercase tracking-wide">
            {title}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-3xl font-semibold">{value}</div>
            <div className="text-sm font-medium opacity-80">{description}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
