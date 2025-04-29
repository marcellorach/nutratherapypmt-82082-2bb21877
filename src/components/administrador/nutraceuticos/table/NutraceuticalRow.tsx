
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Nutraceutical, NutraceuticalCondition } from "@/types";
import HealthConditionTags from './HealthConditionTags';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NutraceuticalRowProps {
  nutraceutical: Nutraceutical;
  expanded: boolean;
  onToggleExpand: () => void;
  onConditionClick: (
    nutraceutical: Nutraceutical, 
    condition: NutraceuticalCondition, 
    conditionType: 'prevention' | 'treatment' | 'support'
  ) => void;
}

const NutraceuticalRow: React.FC<NutraceuticalRowProps> = ({ 
  nutraceutical, 
  expanded,
  onToggleExpand,
  onConditionClick
}) => {
  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleExpand}
            className="h-6 w-6 p-0"
          >
            {expanded ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronRight className="h-4 w-4" />}
          </Button>
          {nutraceutical.name}
        </div>
      </TableCell>
      <TableCell>
        <HealthConditionTags 
          conditions={nutraceutical.preventionConditions}
          onConditionClick={(condition) => 
            onConditionClick(nutraceutical, condition, 'prevention')
          }
        />
      </TableCell>
      <TableCell>
        <HealthConditionTags 
          conditions={nutraceutical.treatmentConditions}
          onConditionClick={(condition) => 
            onConditionClick(nutraceutical, condition, 'treatment')
          }
        />
      </TableCell>
      <TableCell>
        <HealthConditionTags 
          conditions={nutraceutical.supportConditions}
          onConditionClick={(condition) => 
            onConditionClick(nutraceutical, condition, 'support')
          }
        />
      </TableCell>
    </TableRow>
  );
};

export default NutraceuticalRow;
