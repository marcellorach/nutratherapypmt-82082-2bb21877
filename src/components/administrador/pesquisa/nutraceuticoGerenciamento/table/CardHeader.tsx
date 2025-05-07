
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { CardTitle, CardDescription } from '@/components/ui/card';
import SearchFilters from './SearchFilters';

interface CardHeaderProps {
  refreshData: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  hasMigratedData: boolean;
  openMigratorDialog: () => void;
}

const CardHeaderComponent: React.FC<CardHeaderProps> = ({
  refreshData,
  searchTerm,
  setSearchTerm,
  hasMigratedData,
  openMigratorDialog
}) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <CardTitle>Nutracêuticos</CardTitle>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={refreshData}
          >
            <RefreshCcw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          {!hasMigratedData && (
            <Button
              size="sm"
              onClick={openMigratorDialog}
            >
              <RefreshCcw className="h-4 w-4 mr-1" />
              Migrar Dados
            </Button>
          )}
        </div>
      </div>
      <CardDescription>
        Visualize e gerencie todos os nutracêuticos do banco de dados
      </CardDescription>
      <SearchFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
    </>
  );
};

export default CardHeaderComponent;
