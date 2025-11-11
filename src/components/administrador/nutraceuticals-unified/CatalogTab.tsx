
import React, { useState } from 'react';
import { useNutraceuticalContext } from '@/contexts/NutraceuticalContext';
import { NutraceuticalDataMigrator } from '@/utils/nutraceutical-data-migrator';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

// Componentes comuns
import NutraceuticalCRUDDialog from '@/components/common/nutraceuticals/NutraceuticalCRUDDialog';

// Componentes específicos do Gerenciamento
import PageHeaderWithActions from '../pesquisa/nutraceuticoGerenciamento/PageHeaderWithActions';
import NutraceuticalTable from '../pesquisa/nutraceuticoGerenciamento/NutraceuticalTable';
import StatsGrid from '../pesquisa/nutraceuticoGerenciamento/StatsGrid';
import MigratorDialog from '../pesquisa/nutraceuticoGerenciamento/MigratorDialog';
import DeleteDialog from '../pesquisa/nutraceuticoGerenciamento/DeleteDialog';

const CatalogTab: React.FC = () => {
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
  const [isMigratingConditions, setIsMigratingConditions] = useState(false);

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

  const handleMigrateConditions = async () => {
    setIsMigratingConditions(true);
    try {
      console.log('🔄 Chamando Edge Function migrate-nutraceutical-conditions...');
      
      const { data, error } = await supabase.functions.invoke('migrate-nutraceutical-conditions', {
        body: {}
      });

      if (error) throw error;

      console.log('✅ Resposta da Edge Function:', data);

      if (data.success) {
        toast({
          title: t('nutraceuticalsUnified.migration.success'),
          description: t('nutraceuticalsUnified.migration.successDesc', {
            count: data.stats.totalRelationsCreated,
            nutraCount: data.stats.nutraWithConditions
          }),
        });
        refreshData();
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      console.error('❌ Erro ao migrar condições:', err);
      toast({
        title: t('nutraceuticalsUnified.migration.error'),
        description: t('nutraceuticalsUnified.migration.errorDesc', { error: err.message }),
        variant: "destructive",
      });
    } finally {
      setIsMigratingConditions(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeaderWithActions refreshData={refreshData} />
        <Button 
          onClick={handleMigrateConditions}
          disabled={isMigratingConditions}
          variant="outline"
          className="ml-auto"
        >
          {isMigratingConditions ? t('nutraceuticalsUnified.migration.running') : `🔗 ${t('nutraceuticalsUnified.migration.button')}`}
        </Button>
      </div>
      
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

export default CatalogTab;
