
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

interface ActionFooterProps {
  onImport: () => void;
  onCancel: () => void;
}

const ActionFooter: React.FC<ActionFooterProps> = ({ onImport, onCancel }) => {
  return (
    <CardFooter className="border-t flex justify-end gap-2 p-4 bg-gray-50">
      <Button 
        variant="outline" 
        onClick={onCancel}
        className="flex items-center gap-1"
      >
        <X className="h-4 w-4" />
        <span>Cancelar</span>
      </Button>
      <Button 
        onClick={onImport} 
        className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1"
      >
        <Check className="h-4 w-4" />
        <span>Confirmar Importação</span>
      </Button>
    </CardFooter>
  );
};

export default ActionFooter;
