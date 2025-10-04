import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SummaryHeaderProps {
  originalFileName: string;
  processedAt: string;
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({ originalFileName, processedAt }) => {
  const { t, i18n } = useTranslation();
  
  const formatDateString = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'pt' ? 'pt-BR' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-green-50 rounded-md p-4 flex items-start gap-3">
      <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="font-medium text-green-800">{t('import.results.summary.title')}</h3>
        <p 
          className="text-sm text-green-700 mt-1"
          dangerouslySetInnerHTML={{
            __html: t('import.results.summary.description', { 
              fileName: originalFileName, 
              date: formatDateString(processedAt) 
            })
          }}
        />
      </div>
    </div>
  );
};

export default SummaryHeader;
