import React from 'react';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { Check, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ActionFooterProps {
  onImport: () => void;
  onCancel: () => void;
  isImporting?: boolean;
  importSuccess?: boolean;
}

const ActionFooter: React.FC<ActionFooterProps> = ({ 
  onImport, 
  onCancel,
  isImporting = false,
  importSuccess = false
}) => {
  const { t } = useTranslation();
  
  return (
    <CardFooter className="border-t flex justify-end gap-2 p-4 bg-gray-50">
      <Button 
        variant="outline" 
        onClick={onCancel}
        className="flex items-center gap-1"
        disabled={isImporting}
      >
        <X className="h-4 w-4" />
        <span>{t('import.buttons.cancel')}</span>
      </Button>
      <Button 
        onClick={onImport} 
        className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1"
        disabled={isImporting || importSuccess}
      >
        {isImporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('import.buttons.confirming')}</span>
          </>
        ) : importSuccess ? (
          <>
            <Check className="h-4 w-4" />
            <span>{t('import.buttons.confirmed')}</span>
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            <span>{t('import.buttons.confirm')}</span>
          </>
        )}
      </Button>
    </CardFooter>
  );
};

export default ActionFooter;
