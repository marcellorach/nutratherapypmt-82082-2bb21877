
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CardHeaderProps {
  refreshData: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  hasMigratedData: boolean;
  openMigratorDialog: () => void;
}

const CardHeaderComponent: React.FC<CardHeaderProps> = ({
  refreshData,
  searchTerm,
  setSearchTerm,
  hasMigratedData,
  openMigratorDialog
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div className="flex-1 w-full sm:w-auto">
        <Input
          placeholder={t('nutraManagement.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          className="h-9"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {t('nutraManagement.refresh')}
        </Button>

        {!hasMigratedData && (
          <Button
            variant="default"
            size="sm"
            onClick={openMigratorDialog}
            className="h-9"
          >
            <Upload className="h-4 w-4 mr-1" />
            {t('nutraManagement.importData')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CardHeaderComponent;
