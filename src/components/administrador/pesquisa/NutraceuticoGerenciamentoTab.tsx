
import React, { useState } from 'react';
import { useNutraceuticalContext } from '@/contexts/NutraceuticalContext';
import { NutraceuticalDataMigrator } from '@/utils/nutraceutical-data-migrator';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

// Componentes comuns
import NutraceuticalCRUDDialog from '@/components/common/nutraceuticals/NutraceuticalCRUDDialog';

// Componentes específicos
import PageHeaderWithActions from './nutraceuticoGerenciamento/PageHeaderWithActions';
import NutraceuticalTable from './nutraceuticoGerenciamento/NutraceuticalTable';
import StatsGrid from './nutraceuticoGerenciamento/StatsGrid';
import MigratorDialog from './nutraceuticoGerenciamento/MigratorDialog';
import DeleteDialog from './nutraceuticoGerenciamento/DeleteDialog';

const NutraceuticoGerenciamentoTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    nutraceuticals,
    outcomes,
    conditions,
    studies,
    isLoading,
    error,
    refreshData,
    deleteNutraceutical
  } = useNutraceuticalContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [isMigratorDialogOpen, setIsMigratorDialogOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [hasMigratedData, setHasMigratedData] = useState(nutraceuticals.length > 0);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nutraceuticalToDelete, setNutraceuticalToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<any>(null);
  
  const { toast } = useToast();
  
  const filteredNutraceuticals = nutraceuticals.filter(nutra => {
    const matchesSearch = searchTerm === '' || 
      nutra.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (nutra.description && nutra.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesOutcome = selectedOutcome === null || 
      nutra.outcome?.id === selectedOutcome;
      
    return matchesSearch && matchesOutcome;
  });

  const handleEditClick = (nutra: any) => {
    setSelectedNutraceutical(nutra);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (nutraId: string) => {
    setNutraceuticalToDelete(nutraId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!nutraceuticalToDelete) return;

    setIsDeleting(true);
    try {
      await deleteNutraceutical(nutraceuticalToDelete);
      toast({
        title: t('nutraceuticalDatabase.messages.deleted'),
        description: t('nutraceuticalDatabase.messages.deletedDescription'),
      });
      setDeleteDialogOpen(false);
      setNutraceuticalToDelete(null);
    } catch (error: any) {
      toast({
        title: t('nutraceuticalDatabase.messages.deleteError'),
        description: t('nutraceuticalDatabase.messages.deleteErrorDescription', { error: error.message }),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleStartMigration = async () => {
    setIsMigrating(true);
    try {
      const result = await NutraceuticalDataMigrator.migrateAll();
      setMigrationResult(result);
      
      if (result.success) {
        setHasMigratedData(true);
        toast({
          title: t('nutraceuticalDatabase.messages.migrationComplete'),
          description: result.message,
        });
        refreshData();
      } else {
        toast({
          title: t('nutraceuticalDatabase.messages.migrationError'),
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
        title: t('nutraceuticalDatabase.messages.migrationError'),
        description: t('nutraceuticalDatabase.messages.migrationErrorDescription'),
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <PageHeaderWithActions refreshData={refreshData} />
      
      <StatsGrid
        nutraceuticals={nutraceuticals}
        outcomes={outcomes}
        conditions={conditions}
        studies={studies}
        isLoading={isLoading}
      />
      
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
        onEditClick={handleEditClick}
      />
      
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
      
      {/* Diálogo de edição usando o componente unificado */}
      <NutraceuticalCRUDDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        nutraceutical={selectedNutraceutical}
        onSuccess={() => {
          setEditDialogOpen(false);
          setSelectedNutraceutical(null);
          refreshData();
        }}
        mode="scientific"
      />
    </div>
  );
};

export default NutraceuticoGerenciamentoTab;
