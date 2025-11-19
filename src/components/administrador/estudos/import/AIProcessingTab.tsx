import React from 'react';
import NtaiProcessingSection from '../analysis/NtaiProcessingSection';
import { useTranslation } from 'react-i18next';

const AIProcessingTab: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
          {t('studies.aiProcessing.title')}
        </h3>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          {t('studies.aiProcessing.description')}
        </p>
      </div>
      <NtaiProcessingSection />
    </div>
  );
};

export default AIProcessingTab;
