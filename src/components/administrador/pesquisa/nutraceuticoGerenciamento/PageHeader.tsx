
import React from 'react';
import { Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PageHeader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div className="flex items-center">
        <Database className="h-8 w-8 mr-3 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">{t('pageHeader.title')}</h1>
          <p className="text-gray-600">{t('pageHeader.description')}</p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4 md:mt-0">
        <Button variant="outline" className="flex items-center">
          <BookOpen className="mr-2 h-4 w-4" />
          {t('pageHeader.exportData')}
        </Button>
        <Button variant="outline" className="flex items-center">
          <FileText className="mr-2 h-4 w-4" />
          {t('pageHeader.reports')}
        </Button>
      </div>
    </div>
  );
};

export default PageHeader;
