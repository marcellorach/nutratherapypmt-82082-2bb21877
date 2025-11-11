
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VeterinaryTargetsHeaderProps {
  onAddNew: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const VeterinaryTargetsHeader: React.FC<VeterinaryTargetsHeaderProps> = ({
  onAddNew,
  onRefresh,
  isRefreshing
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">{t('admin.sidebar.knowledgeBase.veterinaryTargets')}</h2>
        <p className="text-muted-foreground">
          {t('admin.veterinaryTargets.header.subtitle')}
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('admin.veterinaryTargets.header.refresh')}
        </Button>
        
        <Button
          onClick={onAddNew}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('admin.veterinaryTargets.header.newCondition')}
        </Button>
      </div>
    </div>
  );
};

export default VeterinaryTargetsHeader;
