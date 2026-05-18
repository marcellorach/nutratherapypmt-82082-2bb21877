
import React from 'react';
import { Button } from "@/components/ui/button";
import { Filter, Plus } from "lucide-react";
import { useTranslation } from 'react-i18next';
import TabInfoButton from '../common/TabInfoButton';
import { adminTabsInfoBilingual } from '@/data/admin-tabs-info-bilingual';

interface EstudosHeaderProps {
  onAddEstudo: () => void;
}

const EstudosHeader: React.FC<EstudosHeaderProps> = ({ onAddEstudo }) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-xl font-bold">{t('studies.header.title')}</h2>
        <p className="text-gray-600">{t('studies.header.description')}</p>
      </div>
      
      <div className="flex items-center gap-3">
        <TabInfoButton
          tabId="estudos"
          title={t('studies.header.title')}
          content={adminTabsInfoBilingual['estudos']}
        />
        
        <Button variant="outline" className="flex items-center">
          <Filter className="mr-2 h-4 w-4" />
          {t('studies.header.advancedFilters')}
        </Button>
        <Button onClick={onAddEstudo} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          {t('studies.header.addStudy')}
        </Button>
      </div>
    </div>
  );
};

export default EstudosHeader;
