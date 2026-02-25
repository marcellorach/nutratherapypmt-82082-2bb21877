
import React from 'react';
import EstudosHeader from './estudos/EstudosHeader';
import SciImportSection from './estudos/import/SciImportSection';
import { UploadEstudoForm } from './estudos/UploadEstudoForm';
import { useTranslation } from 'react-i18next';
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import './estudos/estudos.css';

const EstudosTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <EstudosHeader onAddEstudo={() => {}} />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-green-600" />
            <h3 className="text-lg font-medium">{t('studies.import.uploadAndExtraction')}</h3>
          </div>
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
            {t('common.recommended')}
          </Badge>
        </div>
        <UploadEstudoForm />
        
        <SciImportSection />
      </div>
    </>
  );
};

export default EstudosTab;
