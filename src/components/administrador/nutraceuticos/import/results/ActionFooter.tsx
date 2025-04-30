
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';

interface ActionFooterProps {
  onImport: () => void;
  onCancel: () => void;
}

const ActionFooter: React.FC<ActionFooterProps> = ({ onImport, onCancel }) => {
  return (
    <CardFooter className="border-t flex justify-end gap-2 p-4">
      <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      <Button onClick={onImport}>Confirmar Importação</Button>
    </CardFooter>
  );
};

export default ActionFooter;
