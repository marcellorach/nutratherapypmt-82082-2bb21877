
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';

const ConfiguracoesAvisosIA: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <Alert className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{t('configAvisosIA.title')}</AlertTitle>
      <AlertDescription>
        {t('configAvisosIA.description')}
      </AlertDescription>
    </Alert>
  );
};

export default ConfiguracoesAvisosIA;
