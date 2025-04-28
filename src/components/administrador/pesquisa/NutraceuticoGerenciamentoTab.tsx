
import React, { useState } from 'react';
import { useNutraceuticalManager } from '@/hooks/useNutraceuticalManager';
import { NutraceuticalDataMigrator } from '@/utils/nutraceutical-data-migrator';
import { useToast } from '@/hooks/use-toast';

// Componentes refatorados
import PageHeader from './nutraceuticoGerenciamento/PageHeader';
import NutraceuticalTable from './nutraceuticoGerenciamento/NutraceuticalTable';
import StatisticsPanel from './nutraceuticoGerenciamento/StatisticsPanel';
import LastUpdatePanel from './nutraceuticoGerenciamento/LastUpdatePanel';
import ActionPanel from './nutraceuticoGerenciamento/ActionPanel';
import MigratorDialog from './nutraceuticoGerenciamento/MigratorDialog';
import DeleteDialog from './nutraceuticoGerenciamento/DeleteDialog';

// Componente principal
const NutraceuticoGerenciamentoTab: React.FC = () => {
  const {
    nutraceuticals,
    categories,
    conditions,
    studies,
    isLoading,
    error,
    refreshData,
    deleteNutraceutical
  } = useNutraceuticalManager();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isMigratorDialogOpen, setIsMigratorDialogOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [hasMigratedData, setHasMigratedData] = useState(nutraceuticals.length > 0);

  // Estado para diálogo de confirmação de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nutraceuticalToDelete, setNutraceuticalToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  
  // Função para filtrar nutracêuticos
  const filteredNutraceuticals = nutraceuticals.filter(nutra => {
    const matchesSearch = searchTerm === '' || 
      nutra.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (nutra.description && nutra.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCategory = selectedCategory === null || 
      nutra.category_id?.id === selectedCategory;
      
    return matchesSearch && matchesCategory;
  });

  // Função para iniciar o processo de exclusão
  const handleDeleteClick = (nutraId: string) => {
    setNutraceuticalToDelete(nutraId);
    setDeleteDialogOpen(true);
  };

  // Função para confirmar e executar a exclusão
  const confirmDelete = async () => {
    if (!nutraceuticalToDelete) return;

    setIsDeleting(true);
    try {
      await deleteNutraceutical(nutraceuticalToDelete);
      toast({
        title: "Nutracêutico excluído",
        description: "O nutracêutico foi removido com sucesso.",
      });
      setDeleteDialogOpen(false);
      setNutraceuticalToDelete(null);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: `Não foi possível excluir o nutracêutico: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Função para executar a migração
  const handleStartMigration = async () => {
    setIsMigrating(true);
    try {
      const result = await NutraceuticalDataMigrator.migrateAll();
      setMigrationResult(result);
      
      if (result.success) {
        setHasMigratedData(true);
        toast({
          title: "Migração concluída",
          description: result.message,
        });
        refreshData();
      } else {
        toast({
          title: "Erro na migração",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Erro ao executar migração:", err);
      setMigrationResult({
        success: false,
        message: `Erro inesperado: ${err.message}`
      });
      
      toast({
        title: "Erro na migração",
        description: "Ocorreu um erro inesperado durante o processo de migração",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };
  
  // Renderização com componentes refatorados
  return (
    <div className="space-y-6">
      <PageHeader />
      
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Painel principal */}
        <div className="w-full lg:w-2/3 space-y-4">
          <NutraceuticalTable 
            nutraceuticals={nutraceuticals}
            filteredNutraceuticals={filteredNutraceuticals}
            isLoading={isLoading}
            error={error}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            refreshData={refreshData}
            handleDeleteClick={handleDeleteClick}
            hasMigratedData={hasMigratedData}
            openMigratorDialog={() => setIsMigratorDialogOpen(true)}
          />
        </div>
        
        {/* Painel lateral */}
        <div className="w-full lg:w-1/3 space-y-4">
          <StatisticsPanel 
            nutraceuticals={nutraceuticals}
            categories={categories}
            conditions={conditions}
            studies={studies}
            isLoading={isLoading}
          />
          
          <LastUpdatePanel isLoading={isLoading} />
          
          <ActionPanel />
        </div>
      </div>
      
      {/* Diálogos */}
      <MigratorDialog 
        open={isMigratorDialogOpen}
        onOpenChange={setIsMigratorDialogOpen}
        isMigrating={isMigrating}
        migrationResult={migrationResult}
        onStartMigration={handleStartMigration}
      />

      <DeleteDialog 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        isDeleting={isDeleting}
        onConfirmDelete={confirmDelete}
      />
    </div>
  );
};

export default NutraceuticoGerenciamentoTab;
