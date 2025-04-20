
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { Nutraceutical } from "@/types";
import StarRating from './StarRating';

interface NutraceuticalRowProps {
  nutraceutical: Nutraceutical;
  onOpenDetails: (nutraceutical: Nutraceutical) => void;
}

const NutraceuticalRow: React.FC<NutraceuticalRowProps> = ({ nutraceutical, onOpenDetails }) => {
  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium">{nutraceutical.name}</TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-slate-50">
          {nutraceutical.condition}
        </Badge>
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
          onClick={() => onOpenDetails(nutraceutical)}
          className="hover:bg-gray-100"
        >
          <FileText className="h-4 w-4 mr-1" />
          Detalhes
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default NutraceuticalRow;
