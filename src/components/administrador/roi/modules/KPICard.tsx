import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendUp, 
  icon, 
  color 
}) => {
  return (
    <Card className="overflow-hidden border-t-4" style={{ borderTopColor: color }}>
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className={`rounded-full p-3 bg-opacity-10`} style={{ backgroundColor: `${color}20` }}>
            {icon}
          </div>
        </div>
        
        {trend && (
          <div className={`flex items-center mt-4 text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;