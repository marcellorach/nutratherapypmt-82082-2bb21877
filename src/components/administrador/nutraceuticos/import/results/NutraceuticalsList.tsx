
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NutraceuticalDetailsProps {
  nutraceutical: any;
  isExpanded: boolean;
  onToggleExpand: (name: string) => void;
}

const NutraceuticalDetails: React.FC<NutraceuticalDetailsProps> = ({ 
  nutraceutical, 
  isExpanded, 
  onToggleExpand 
}) => {
  return (
    <div className="py-3">
      <div 
        className="flex items-center justify-between cursor-pointer" 
        onClick={() => onToggleExpand(nutraceutical.name)}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium">{nutraceutical.name}</span>
            {nutraceutical.category && (
              <Badge variant="outline" className="ml-2">
                {nutraceutical.category}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{nutraceutical.description}</p>
        </div>
        <div>
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="pl-4 mt-3 border-l-2 border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nutraceutical.chemical_compound && (
              <div>
                <p className="text-sm font-medium">Composto Químico</p>
                <p className="text-sm">{nutraceutical.chemical_compound}</p>
              </div>
            )}
            
            {nutraceutical.source && (
              <div>
                <p className="text-sm font-medium">Origem</p>
                <p className="text-sm">{nutraceutical.source}</p>
              </div>
            )}
            
            {nutraceutical.dosage && (
              <div>
                <p className="text-sm font-medium">Dosagem</p>
                <p className="text-sm">{nutraceutical.dosage}</p>
              </div>
            )}
          </div>
          
          {nutraceutical.conditions && nutraceutical.conditions.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">Condições Relacionadas</p>
              <div className="flex flex-wrap gap-2">
                {nutraceutical.conditions.map((condition: any, idx: number) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className={`${
                      condition.relationship_type === 'prevention' 
                        ? 'bg-blue-50 text-blue-700' 
                        : condition.relationship_type === 'treatment'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-purple-50 text-purple-700'
                    }`}
                  >
                    {condition.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
