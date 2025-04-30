
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import NutraceuticalDetails from './NutraceuticalDetails';

interface NutraceuticalsListProps {
  nutraceuticals: any[];
}

const NutraceuticalsList: React.FC<NutraceuticalsListProps> = ({ nutraceuticals }) => {
  const [expandedNutraceutical, setExpandedNutraceutical] = useState<string | null>(null);
  
  const toggleExpand = (name: string) => {
    setExpandedNutraceutical(expandedNutraceutical === name ? null : name);
  };

  return (
    <Card>
      <CardContent className="pt-6 px-6">
        <h3 className="text-lg font-medium mb-4">Nutracêuticos Identificados</h3>
        <div className="divide-y">
          {nutraceuticals.map((nutra: any, idx: number) => (
            <NutraceuticalDetails 
              key={idx}
              nutraceutical={nutra}
              isExpanded={expandedNutraceutical === nutra.name}
              onToggleExpand={toggleExpand}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NutraceuticalsList;
