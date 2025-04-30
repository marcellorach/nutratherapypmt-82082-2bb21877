
import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  description: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, description }) => (
  <div className="bg-white border rounded-md p-4 flex flex-col gap-1">
    <h4 className="text-sm text-gray-500 uppercase tracking-wide">{title}</h4>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

export default StatsCard;
