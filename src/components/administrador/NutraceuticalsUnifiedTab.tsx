
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NutraceuticalProvider, useNutraceuticalContext } from '@/contexts/NutraceuticalContext';
import { Button } from '@/components/ui/button';
import { LayoutList, Table2 } from 'lucide-react';
import TabInfoButton from './common/TabInfoButton';
import { adminTabsInfo } from '@/data/admin-tabs-info';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Componentes comuns
import NutraceuticalCRUDDialog from '@/components/common/nutraceuticals/NutraceuticalCRUDDialog';
import NutraceuticalSearchFilters from '@/components/common/nutraceuticals/NutraceuticalSearchFilters';

// Componentes do Catalog
import PageHeaderWithActions from './pesquisa/nutraceuticoGerenciamento/PageHeaderWithActions';
import NutraceuticalTable from './pesquisa/nutraceuticoGerenciamento/NutraceuticalTable';
import StatsGrid from './pesquisa/nutraceuticoGerenciamento/StatsGrid';
import MigratorDialog from './pesquisa/nutraceuticoGerenciamento/MigratorDialog';
import DeleteDialog from './pesquisa/nutraceuticoGerenciamento/DeleteDialog';

// Componentes do Matrix
import { NutraceuticosHeader } from './nutraceuticos/NutraceuticosHeader';
import NutraceuticosExpandableTable from './nutraceuticos/NutraceuticosExpandableTable';
import EvidenceLegendPanel from './nutraceuticos/table/EvidenceLegendPanel';

import { NutraceuticalDataMigrator } from '@/utils/nutraceutical-data-migrator';
import { useNutraceuticalsFilter } from '@/hooks/nutraceuticals/useNutraceuticalsFilter';
import { Skeleton } from '@/components/ui/skeleton';

type ViewMode = 'simple' | 'matrix';

const NutraceuticalsUnifiedContent: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
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

  const [viewMode, setViewMode] = useState<ViewMode>('matrix');

  // Shared state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedNutraceutical, setSelectedNutraceutical] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nutraceuticalToDelete, setNutraceuticalToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Migration state (simple view)
  const [isMigratorDialogOpen, setIsMigratorDialogOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [hasMigratedData, setHasMigratedData] = useState(nutraceuticals.length > 0);
  const [isMigratingConditions, setIsMigratingConditions] = useState(false);

  // Simple view search
  const [simpleSearchTerm, setSimpleSearchTerm] = useState('');

  // Matrix view filters
  const {
    searchTerm: matrixSearchTerm,
    setSearchTerm: setMatrixSearchTerm,
    filterEfficacy,
    setFilterEfficacy,
    filterCondition,
    setFilterCondition,
    filteredNutraceuticals: matrixFiltered,
    clearFilters
  } = useNutraceuticalsFilter(nutraceuticals);

  // Simple view filtering
  const simpleFiltered = nutraceuticals.filter(nutra => {
    return simpleSearchTerm === '' ||
      nutra.name?.toLowerCase().includes(simpleSearchTerm.toLowerCase()) ||
      (nutra.description && nutra.description.toLowerCase().includes(simpleSearchTerm.toLowerCase()));
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
        description: error.message,
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
        toast({ title: t('nutraceuticalDatabase.messages.migrationComplete'), description: result.message });
        refreshData();
      } else {
        toast({ title: t('nutraceuticalDatabase.messages.migrationError'), description: result.message, variant: "destructive" });
      }
    } catch (err: any) {
      setMigrationResult({ success: false, message: `Erro: ${err.message}` });
      toast({ title: t('nutraceuticalDatabase.messages.migrationError'), description: err.message, variant: "destructive" });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleMigrateConditions = async () => {
    setIsMigratingConditions(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-nutraceutical-conditions', { body: {} });
      if (error) throw error;
      if (data.success) {
        toast({
          title: t('nutraceuticalsUnified.migration.success'),
          description: t('nutraceuticalsUnified.migration.successDesc', { count: data.stats.totalRelationsCreated, nutraCount: data.stats.nutraWithConditions }),
        });
        refreshData();
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      toast({ title: t('nutraceuticalsUnified.migration.error'), description: err.message, variant: "destructive" });
    } finally {
      setIsMigratingConditions(false);
    }
  };

  const handleConditionClick = (nutraceutical: any, condition: any, conditionType: 'prevention' | 'treatment' | 'support') => {
    // Future: open condition detail
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try { await refreshData(); } finally { setIsRefreshing(false); }
  };

  const filterEfficacyString = filterEfficacy !== null
    ? (typeof filterEfficacy === 'number' ? filterEfficacy.toString() : filterEfficacy)
    : '';

  const handleSetFilterEfficacy = (value: string) => {
    if (value === '' || value === 'all') setFilterEfficacy(null);
    else if (value === 'high') setFilterEfficacy(4);
    else if (value === 'medium') setFilterEfficacy(3);
    else if (value === 'low') setFilterEfficacy(2);
    else setFilterEfficacy(parseInt(value, 10) || null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.sidebar.knowledgeBase.nutraceuticalsUnified')}</h2>
          <p className="text-muted-foreground">{t('nutraceuticalsUnified.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border rounded-lg p-1 bg-muted/30">
            <Button
              variant={viewMode === 'simple' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('simple')}
              className="gap-1.5"
            >
              <LayoutList className="h-4 w-4" />
              {t('nutraceuticalsUnified.views.simple')}
            </Button>
            <Button
              variant={viewMode === 'matrix' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('matrix')}
              className="gap-1.5"
            >
              <Table2 className="h-4 w-4" />
              {t('nutraceuticalsUnified.views.matrix')}
            </Button>
          </div>

          <TabInfoButton
            tabId="nutraceuticals-unified"
            title={t('admin.sidebar.knowledgeBase.nutraceuticalsUnified')}
            content={adminTabsInfo['nutraceuticals-unified']}
          />
        </div>
      </div>

      {/* Stats - always visible */}
      <StatsGrid
        nutraceuticals={nutraceuticals}
        outcomes={outcomes}
        conditions={conditions}
        studies={studies}
        isLoading={isLoading}
      />

      {/* Simple View */}
      {viewMode === 'simple' && (
        <>
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

          <NutraceuticalTable
            nutraceuticals={nutraceuticals}
            filteredNutraceuticals={simpleFiltered}
            isLoading={isLoading}
            error={error}
            searchTerm={simpleSearchTerm}
            setSearchTerm={setSimpleSearchTerm}
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
        </>
      )}

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <div className="w-full max-w-full overflow-hidden space-y-6">
          <NutraceuticosHeader />

          <div className="bg-background rounded-md shadow w-full max-w-full">
            <NutraceuticalSearchFilters
              searchTerm={matrixSearchTerm}
              setSearchTerm={setMatrixSearchTerm}
              filterEfficacy={filterEfficacyString}
              setFilterEfficacy={handleSetFilterEfficacy}
              filterCondition={filterCondition || 'all'}
              setFilterCondition={setFilterCondition}
              clearFilters={clearFilters}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              onAddNew={() => {
                setSelectedNutraceutical(null);
                setEditDialogOpen(true);
              }}
              mode="scientific"
            />

            <div className="p-6 w-full max-w-full">
              <EvidenceLegendPanel />

              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="w-full max-w-full overflow-hidden">
                  <NutraceuticosExpandableTable
                    nutraceuticals={matrixFiltered}
                    onEditClick={handleEditClick}
                    onConditionClick={handleConditionClick}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shared dialogs */}
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

const NutraceuticalsUnifiedTab: React.FC = () => {
  return (
    <NutraceuticalProvider>
      <NutraceuticalsUnifiedContent />
    </NutraceuticalProvider>
  );
};

export default NutraceuticalsUnifiedTab;
