
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Edit2, X, Info } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Nutraceutical } from '@/types';

interface ActiveIngredientTagProps {
  name: string;
  quantity: string;
  originalIndex: number;
  nutraceutical: Nutraceutical;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

const ActiveIngredientTag: React.FC<ActiveIngredientTagProps> = ({
  name,
  quantity,
  originalIndex,
  nutraceutical,
  onEdit,
  onRemove
}) => {
  return (
    <Badge 
      variant="outline" 
      className="py-1 pl-2 pr-1 flex items-center gap-1 bg-slate-50"
    >
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 p-0.5 hover:bg-transparent">
              <Info size={12} className="text-blue-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-2">
              <h4 className="font-medium">{name}</h4>
              <p className="text-sm text-gray-600">
                Este princípio ativo é utilizado para tratar {nutraceutical.condition.toLowerCase()}.
              </p>
              
              <div className="mt-2 space-y-1">
                <h5 className="text-xs font-medium text-gray-500">Estudos Científicos:</h5>
                {nutraceutical.scientificEvidence.studies.map((study, i) => (
                  <div key={i} className="text-xs flex items-start gap-1">
                    <a href={study.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center">
                      <span className="ml-1">{study.title} ({study.year})</span>
                    </a>
                  </div>
                ))}
              </div>
              
              <div className="mt-2 flex gap-2 text-xs">
                <Badge variant="outline" className="bg-slate-50">
                  Eficácia: {nutraceutical.scientificEvidence.efficacyScore}/5
                </Badge>
                <Badge variant="outline" className="bg-slate-50">
                  Sustentação: {nutraceutical.scientificEvidence.sustainabilityScore}/5
                </Badge>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <span>{name} ({quantity})</span>
      </div>
      <div className="flex">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 p-0.5 hover:bg-slate-200" 
          onClick={() => onEdit(originalIndex)}
        >
          <Edit2 size={14} className="text-blue-500" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 p-0.5 hover:bg-slate-200" 
          onClick={() => onRemove(originalIndex)}
        >
          <X size={14} className="text-red-500" />
        </Button>
      </div>
    </Badge>
  );
};

export default ActiveIngredientTag;
