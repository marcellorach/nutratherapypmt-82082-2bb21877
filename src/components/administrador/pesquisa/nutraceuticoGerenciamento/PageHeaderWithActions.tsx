import React, { useState } from 'react';
import { Database, Plus, RefreshCw, FileText, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddNutraceuticalDialog from './dialogs/AddNutraceuticalDialog';
import AddScientificStudyDialog from './dialogs/AddScientificStudyDialog';
import { useTranslation } from 'react-i18next';

interface PageHeaderWithActionsProps {
  refreshData: () => void;
}

const PageHeaderWithActions: React.FC<PageHeaderWithActionsProps> = ({ refreshData }) => {
  const { t, i18n } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isAddStudyDialogOpen, setIsAddStudyDialogOpen] = useState<boolean>(false);

  const handleAddSuccess = () => {
    refreshData();
  };

  const handleStudyAddSuccess = () => {
    setIsAddStudyDialogOpen(false);
  };

  const currentDateTime = new Date().toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div className="flex items-center">
        <Database className="h-8 w-8 mr-3 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">{t('nutraceuticalDatabase.title')}</h1>
          <p className="text-gray-600">
            {t('nutraceuticalDatabase.description')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('nutraceuticalDatabase.lastUpdate', { date: currentDateTime })}
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          variant="default"
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('nutraceuticalDatabase.buttons.addNutraceutical')}
        </Button>
        
        <Button 
          onClick={() => setIsAddStudyDialogOpen(true)} 
          variant="outline"
          className="flex items-center"
        >
          <FileText className="mr-2 h-4 w-4" />
          {t('nutraceuticalDatabase.buttons.addStudy')}
        </Button>
        
        <Button 
          onClick={refreshData} 
          variant="outline"
          className="flex items-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('nutraceuticalDatabase.buttons.refresh')}
        </Button>

        <Button variant="outline" className="flex items-center">
          <BookOpen className="mr-2 h-4 w-4" />
          {t('nutraceuticalDatabase.buttons.exportData')}
        </Button>
      </div>

      {/* Diálogos */}
      <AddNutraceuticalDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAddSuccess}
      />
      
      <AddScientificStudyDialog
        open={isAddStudyDialogOpen}
        onOpenChange={setIsAddStudyDialogOpen}
        onSuccess={handleStudyAddSuccess}
      />
    </div>
  );
};

export default PageHeaderWithActions;