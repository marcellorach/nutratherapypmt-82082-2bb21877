
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import RelatedConditionsList from './RelatedConditionsList';

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
      <Collapsible open={isExpanded}>
        <CollapsibleTrigger asChild>
          <div
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md"
            onClick={() => onToggleExpand(nutraceutical.name)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{nutraceutical.name}</h4>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {nutraceutical.category}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 truncate">{nutraceutical.description}</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pl-6 pr-2 py-3 space-y-3">
            <div className="text-sm">
              <span className="font-medium">Descrição:</span> {nutraceutical.description}
            </div>
            
            <div className="space-y-1">
              <h5 className="font-medium text-sm">Condições Relacionadas:</h5>
              <RelatedConditionsList conditions={nutraceutical.conditions} />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default NutraceuticalDetails;
