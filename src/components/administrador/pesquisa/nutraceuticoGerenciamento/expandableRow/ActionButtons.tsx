
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Link } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  
  return (
    <div className="flex space-x-1">
      {onEditClick && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onEditClick}
          title={t('research.nutraceuticals.actions.edit')}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {onManageRelationships && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onManageRelationships}
          title={t('research.nutraceuticals.actions.manageRelations')}
        >
          <Link className="h-4 w-4" />
        </Button>
      )}
      {onDeleteClick && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDeleteClick}
          title={t('research.nutraceuticals.actions.delete')}
          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ActionButtons;
