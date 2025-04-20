
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Nutraceutical } from "@/types";
import HealthConditionTags from './HealthConditionTags';

interface NutraceuticalRowProps {
  nutraceutical: Nutraceutical;
  onOpenDetails: (nutraceutical: Nutraceutical) => void;
  onConditionClick: (condition: string) => void;
}

const NutraceuticalRow: React.FC<NutraceuticalRowProps> = ({ 
  nutraceutical, 
  onOpenDetails,
  onConditionClick
}) => {
  return (
    <TableRow 
      className="hover:bg-gray-50"
    >
      <TableCell className="font-medium">{nutraceutical.name}</TableCell>
      <TableCell>
        <HealthConditionTags 
          conditions={nutraceutical.preventionConditions} 
          efficacyScore={nutraceutical.scientificEvidence.efficacyScore}
          onConditionClick={onConditionClick}
        />
      </TableCell>
      <TableCell>
        <HealthConditionTags 
          conditions={nutraceutical.treatmentConditions} 
          efficacyScore={nutraceutical.scientificEvidence.efficacyScore}
          onConditionClick={onConditionClick}
        />
      </TableCell>
      <TableCell>
        <HealthConditionTags 
          conditions={nutraceutical.supportConditions} 
          efficacyScore={nutraceutical.scientificEvidence.efficacyScore}
          onConditionClick={onConditionClick}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="sm"
          className="hover:bg-gray-100"
          onClick={() => onOpenDetails(nutraceutical)}
        >
          <FileText className="h-4 w-4 mr-1" />
          Detalhes
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default NutraceuticalRow;
