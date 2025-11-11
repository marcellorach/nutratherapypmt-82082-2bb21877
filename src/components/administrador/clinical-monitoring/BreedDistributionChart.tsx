import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Pet } from '@/utils/mockClinicalData';

interface BreedDistributionChartProps {
  pets: Pet[];
}

const BreedDistributionChart: React.FC<BreedDistributionChartProps> = ({ pets }) => {
  const breedData = useMemo(() => {
    const breedCounts: Record<string, number> = {};
    
    pets.forEach(pet => {
      breedCounts[pet.breed] = (breedCounts[pet.breed] || 0) + 1;
    });
    
    return Object.entries(breedCounts)
      .map(([breed, count]) => ({ breed, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [pets]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={breedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="breed" 
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fontSize: 11 }}
        />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="hsl(var(--primary))" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BreedDistributionChart;
