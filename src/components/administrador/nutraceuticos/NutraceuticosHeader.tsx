
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileUp, FileQuestion, Trash } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import NutraceuticalImportDialog from './import/NutraceuticalImportDialog';
import ManageImportsDialog from './import/ManageImportsDialog';

export const NutraceuticosHeader: React.FC = () => {
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
        <h2 className="text-3xl font-bold tracking-tight">Nutracêuticos</h2>
        <p className="text-muted-foreground">
          Gerencie os nutracêuticos e suas relações com condições de saúde
        </p>
      </div>
      
      <div className="flex items-center gap-2 mt-4 md:mt-0">
        <Button variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Nutracêutico
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsManageImportsDialogOpen(true)}
          className="text-amber-600 border-amber-200 hover:text-amber-700 hover:bg-amber-50"
        >
          <Trash className="mr-2 h-4 w-4" />
          Gerenciar Importações
        </Button>
        
        <Button 
          onClick={() => setIsImportDialogOpen(true)}
          size="sm"
        >
          <FileUp className="mr-2 h-4 w-4" />
          Importar Dados
        </Button>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-2">
              <FileQuestion className="h-4 w-4" />
              <span className="sr-only">Ajuda</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Ajuda - Nutracêuticos</SheetTitle>
              <SheetDescription>
                Aprenda como gerenciar e organizar os nutracêuticos no sistema.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <h3 className="font-medium mb-2">Importação de Dados</h3>
              <p className="text-sm text-muted-foreground mb-4">
                A importação de planilhas permite carregar grandes volumes de dados de nutracêuticos para o sistema. Formatos suportados: CSV e Excel.
              </p>
              
              <h3 className="font-medium mb-2">Associações com Condições</h3>
              <p className="text-sm text-muted-foreground">
                Cada nutracêutico pode ter relações com condições de saúde com diferentes níveis de eficácia para prevenção, tratamento ou suporte.
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
