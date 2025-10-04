
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileUp, FileQuestion, Trash } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import NutraceuticalImportDialog from './import/NutraceuticalImportDialog';
import ManageImportsDialog from './import/ManageImportsDialog';
import { useTranslation } from 'react-i18next';

export const NutraceuticosHeader = () => {
  const { t } = useTranslation();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isManageImportsDialogOpen, setIsManageImportsDialogOpen] = useState(false);
  
  const handleImportComplete = () => {
    // Disparar evento para recarregar dados
    const event = new CustomEvent('nutraceuticals-imported');
    window.dispatchEvent(event);
  };

  const handleImportsDeleted = () => {
    // Disparar evento para recarregar dados
    const event = new CustomEvent('nutraceuticals-imported');
    window.dispatchEvent(event);
  };
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('nutraceuticals.header.title')}</h2>
        <p className="text-muted-foreground">
          {t('nutraceuticals.header.subtitle')}
        </p>
      </div>
      
      <div className="flex items-center gap-2 mt-4 md:mt-0">
        <Button variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('nutraceuticals.header.newButton')}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsManageImportsDialogOpen(true)}
          className="text-amber-600 border-amber-200 hover:text-amber-700 hover:bg-amber-50"
        >
          <Trash className="mr-2 h-4 w-4" />
          {t('nutraceuticals.header.manageImportsButton')}
        </Button>
        
        <Button 
          onClick={() => setIsImportDialogOpen(true)}
          size="sm"
        >
          <FileUp className="mr-2 h-4 w-4" />
          {t('nutraceuticals.header.importButton')}
        </Button>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-2">
              <FileQuestion className="h-4 w-4" />
              <span className="sr-only">{t('nutraceuticals.header.help.title')}</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t('nutraceuticals.header.help.title')}</SheetTitle>
              <SheetDescription>
                {t('nutraceuticals.header.help.subtitle')}
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <h3 className="font-medium mb-2">{t('nutraceuticals.header.help.importTitle')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('nutraceuticals.header.help.importDesc')}
              </p>
              
              <h3 className="font-medium mb-2">{t('nutraceuticals.header.help.associationsTitle')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('nutraceuticals.header.help.associationsDesc')}
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      <NutraceuticalImportDialog 
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={handleImportComplete}
      />
      
      <ManageImportsDialog
        open={isManageImportsDialogOpen}
        onOpenChange={setIsManageImportsDialogOpen}
        onImportsDeleted={handleImportsDeleted}
      />
    </div>
  );
};
