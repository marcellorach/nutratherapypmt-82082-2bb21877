
import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  description: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, description }) => (
  <div className="bg-white border rounded-lg p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-all">
    <h4 className="text-sm text-gray-500 uppercase tracking-wide font-medium">{title}</h4>
    <div className="text-3xl font-bold text-gray-800">{value}</div>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

export default StatsCard;
