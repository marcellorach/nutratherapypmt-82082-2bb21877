
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

interface MigratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMigrating: boolean;
  migrationResult: any;
  onStartMigration: () => void;
}

const MigratorDialog: React.FC<MigratorDialogProps> = ({
  open,
  onOpenChange,
  isMigrating,
  migrationResult,
  onStartMigration
}) => {
  const { t } = useTranslation();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('nutraceuticalDatabase.migrator.title')}</DialogTitle>
          <DialogDescription>
            {t('nutraceuticalDatabase.migrator.description')}
          </DialogDescription>
        </DialogHeader>
        
        {migrationResult && (
          <div className={`p-3 rounded-md ${migrationResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p className="text-sm">{migrationResult.message}</p>
          </div>
        )}
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isMigrating}
          >
            {t('nutraceuticalDatabase.migrator.cancel')}
          </Button>
          <Button 
            onClick={onStartMigration}
            disabled={isMigrating}
          >
            {isMigrating ? t('nutraceuticalDatabase.migrator.migrating') : t('nutraceuticalDatabase.migrator.start')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MigratorDialog;
