
import React from 'react';
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

interface PanelHeaderProps {
  onCreateClick: () => void;
}

const PanelHeader: React.FC<PanelHeaderProps> = ({ onCreateClick }) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium">{t('outcomeManagement.title')}</h3>
      <Button onClick={onCreateClick}>
        {t('outcomeManagement.newOutcome')}
      </Button>
    </div>
  );
};

export default PanelHeader;
