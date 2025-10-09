
import React from 'react';
import { useTranslation } from 'react-i18next';

interface CardFooterProps {
  filteredCount: number;
  totalCount: number;
}

const CardFooterComponent: React.FC<CardFooterProps> = ({
  filteredCount,
  totalCount
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="text-sm text-muted-foreground">
      {t('research.nutraceuticals.table.footer', { filteredCount, totalCount })}
    </div>
  );
};

export default CardFooterComponent;
