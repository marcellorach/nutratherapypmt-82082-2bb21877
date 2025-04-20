
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Nutraceutical, NutraceuticalCondition } from "@/types";
import HealthConditionTags from './HealthConditionTags';

interface NutraceuticalRowProps {
  nutraceutical: Nutraceutical;
  onConditionClick: (
    nutraceutical: Nutraceutical, 
    condition: NutraceuticalCondition, 
    conditionType: 'prevention' | 'treatment' | 'support'
  ) => void;
}

const NutraceuticalRow: React.FC<NutraceuticalRowProps> = ({ 
  nutraceutical, 
  onConditionClick
}) => {
  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium">{nutraceutical.name}</TableCell>
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
