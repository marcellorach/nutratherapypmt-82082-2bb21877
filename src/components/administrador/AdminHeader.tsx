
import React from 'react';
import { Button } from "@/components/ui/button";
import { Settings, BookOpen, Database } from "lucide-react";
import { useTranslation } from 'react-i18next';

const AdminHeader: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold">{t('navbar.researchDev')}</h1>
        <p className="text-gray-600">{t('navbar.platform')}</p>
      </div>
      
      <div className="flex gap-2 mt-4 md:mt-0">
        <Button variant="outline">
          <Database className="mr-2 h-4 w-4" />
          Base de Dados
        </Button>
        <Button variant="outline">
          <BookOpen className="mr-2 h-4 w-4" />
          Biblioteca Científica
        </Button>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          {t('common.settings')}
        </Button>
      </div>
    </div>
  );
};

export default AdminHeader;
