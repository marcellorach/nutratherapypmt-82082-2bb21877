
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface RemovedIngredientTagProps {
  name: string;
  originalIndex: number;
  onRestore: (index: number) => void;
}

const RemovedIngredientTag: React.FC<RemovedIngredientTagProps> = ({
  name,
  originalIndex,
  onRestore
}) => {
  return (
    <Badge 
      variant="outline" 
      className="py-0.5 px-1.5 flex items-center gap-1 bg-gray-100 text-gray-500 opacity-80"
    >
      <span className="text-xs">{name}</span>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-5 w-5 p-0.5 hover:bg-gray-200 ml-0.5" 
        onClick={() => onRestore(originalIndex)}
        title="Restaurar"
      >
        <RotateCcw size={10} className="text-blue-500" />
      </Button>
    </Badge>
  );
};

export default RemovedIngredientTag;
