
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Link } from 'lucide-react';

interface ActionButtonsProps {
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  onManageRelationships?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEditClick,
  onDeleteClick,
  onManageRelationships
}) => {
  return (
    <div className="flex space-x-1">
      {onEditClick && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onEditClick}
          title="Editar nutracêutico"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {onManageRelationships && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onManageRelationships}
          title="Gerenciar relações"
        >
          <Link className="h-4 w-4" />
        </Button>
      )}
      {onDeleteClick && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDeleteClick}
          title="Excluir nutracêutico"
          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ActionButtons;
