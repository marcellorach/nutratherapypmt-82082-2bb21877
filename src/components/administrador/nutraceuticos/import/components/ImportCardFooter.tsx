import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

interface ImportCardFooterProps {
  file: File | null;
  processing: boolean;
  onCancel: () => void;
  onProcess: () => void;
}

const ImportCardFooter: React.FC<ImportCardFooterProps> = ({
  file,
  processing,
  onCancel,
  onProcess
}) => {
  const { t } = useTranslation();
  
  return (
    <CardFooter className="flex justify-end">
      <Button
        variant="outline"
        className="mr-2"
        onClick={onCancel}
      >
        {t('import.buttons.cancel')}
      </Button>
      <Button
        onClick={onProcess}
        disabled={!file || processing}
        className="gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('import.buttons.processing')}
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            {file ? t('import.buttons.process') : t('import.buttons.selectFile')}
          </>
        )}
      </Button>
    </CardFooter>
  );
};

export default ImportCardFooter;
