import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

const ImportCardHeader: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <CardHeader>
      <CardTitle className="flex items-center">
        <FileSpreadsheet className="h-5 w-5 mr-2" />
        {t('import.nutraceuticals.header')}
      </CardTitle>
    </CardHeader>
  );
};

export default ImportCardHeader;
