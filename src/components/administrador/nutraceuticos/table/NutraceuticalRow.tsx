
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Nutraceutical } from "@/types";
import StarRating from './StarRating';
import HealthConditionTags from './HealthConditionTags';

interface NutraceuticalRowProps {
  nutraceutical: Nutraceutical;
  onOpenDetails: (nutraceutical: Nutraceutical) => void;
}

const NutraceuticalRow: React.FC<NutraceuticalRowProps> = ({ nutraceutical, onOpenDetails }) => {
  return (
    <TableRow 
      className="hover:bg-gray-50 cursor-pointer"
      onClick={() => onOpenDetails(nutraceutical)}
    >
      <TableCell className="font-medium">{nutraceutical.name}</TableCell>
      <TableCell>
        <HealthConditionTags conditions={nutraceutical.preventionConditions} />
      </TableCell>
      <TableCell>
        <HealthConditionTags conditions={nutraceutical.treatmentConditions} />
      </TableCell>
      <TableCell>
        <HealthConditionTags conditions={nutraceutical.supportConditions} />
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <span className="font-medium mr-1">
            {nutraceutical.scientificEvidence.efficacyScore.toFixed(1)}
          </span>
          <StarRating score={nutraceutical.scientificEvidence.efficacyScore} />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="sm"
          className="hover:bg-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(nutraceutical);
          }}
        >
          <FileText className="h-4 w-4 mr-1" />
          Detalhes
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default NutraceuticalRow;
