import React, { useCallback } from 'react';
import { EfficacyMatrixProps } from './types';
import { useEfficacyMatrix } from './hooks/useEfficacyMatrix';
import { EfficacyMatrixHeader } from './EfficacyMatrixHeader';
import { EfficacyMatrixFilters } from './EfficacyMatrixFilters';
import { EfficacyMatrixTable } from './EfficacyMatrixTable';
import { EfficacyDetailsDialog } from './EfficacyDetailsDialog';
import { TrendingDown, TrendingUp } from 'lucide-react';

const EfficacyMatrix: React.FC<EfficacyMatrixProps> = ({
  nutraceuticos,
  condicoes,
  data
}) => {
  const {
    searchTerm,
    setSearchTerm,
    selectedCell,
    selectedNutraceutico,
    selectedCondicao,
    dialogOpen,
    setDialogOpen,
    highlightedNutraceutico,
    setHighlightedNutraceutico,
    highlightedCondicao,
    setHighlightedCondicao,
    efficacyFilter,
    setEfficacyFilter,
    evidenceFilter,
    setEvidenceFilter,
    studyCountFilter,
    setStudyCountFilter,
    viewMode,
    setViewMode,
    favoriteRows,
    setFavoriteRows,
    showOnlyFavorites,
    setShowOnlyFavorites,
    comparisonMode,
    setComparisonMode,
    comparisonItems,
    setComparisonItems,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    toggleSortDirection,
    toggleSortBy,
    filteredNutraceuticos,
    sortedNutraceuticos,
    getAverageEfficacy,
    filteredData,
    findCell,
    toggleFavorite,
    toggleComparison,
    exportMatrixData,
  } = useEfficacyMatrix({ nutraceuticos, condicoes, data });

  const getEfficacyColorClass = useCallback((score: number) => {
    if (score >= 80) return "bg-green-500 bg-opacity-20 hover:bg-opacity-30";
    if (score >= 60) return "bg-blue-500 bg-opacity-20 hover:bg-opacity-30";
    if (score >= 40) return "bg-amber-500 bg-opacity-20 hover:bg-opacity-30";
    return "bg-gray-400 bg-opacity-20 hover:bg-opacity-30";
  }, []);

  const getTrendIndicator = useCallback((score: number) => {
    if (score >= 70) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (score >= 50) return <TrendingUp className="h-3 w-3 text-blue-500" />;
    if (score >= 30) return <TrendingDown className="h-3 w-3 text-amber-500" />;
    return <TrendingDown className="h-3 w-3 text-gray-500" />;
  }, []);

  const renderMiniChart = useCallback((score: number) => {
    if (viewMode !== 'detailed') return null;
    
    const data = [
      { name: 'A', value: Math.max(10, score - 15 + Math.random() * 10) },
      { name: 'B', value: Math.max(10, score - 5 + Math.random() * 10) },
      { name: 'C', value: score },
    ];
    
    return (
      <div className="h-6 w-12 opacity-60">
        {score >= 50 ? 
          <TrendingUp className="h-4 w-4 text-green-600" /> : 
          <TrendingDown className="h-4 w-4 text-amber-600" />
        }
      </div>
    );
  }, [viewMode]);

  const getRowAverageEfficacy = useCallback((nutraceuticoId: number) => {
    const cells = filteredData.filter(cell => cell.nutraceuticoId === nutraceuticoId);
    if (!cells.length) return 0;
    return cells.reduce((sum, cell) => sum + cell.efficacyScore, 0) / cells.length;
  }, [filteredData]);

  const getColumnAverageEfficacy = useCallback((condicaoId: number) => {
    const cells = filteredData.filter(cell => cell.condicaoId === condicaoId);
    if (!cells.length) return 0;
    return cells.reduce((sum, cell) => sum + cell.efficacyScore, 0) / cells.length;
  }, [filteredData]);

  const handleCellClick = useCallback((nutraceuticoId: number, condicaoId: number) => {
    const cell = findCell(nutraceuticoId, condicaoId);
    if (cell) {
      const nutraceutico = nutraceuticos.find(n => n.id === nutraceuticoId) || null;
      const condicao = condicoes.find(c => c.id === condicaoId) || null;
      
      setDialogOpen(true);
    }
  }, [findCell, nutraceuticos, condicoes, setDialogOpen]);

  return (
    <div className="space-y-6">
      <EfficacyMatrixHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <EfficacyMatrixFilters 
        efficacyFilter={efficacyFilter}
        evidenceFilter={evidenceFilter}
        studyCountFilter={studyCountFilter}
        viewMode={viewMode}
        showOnlyFavorites={showOnlyFavorites}
        comparisonMode={comparisonMode}
        onEfficacyFilterChange={setEfficacyFilter}
        onEvidenceFilterChange={setEvidenceFilter}
        onStudyCountFilterChange={setStudyCountFilter}
        onViewModeChange={(value) => setViewMode(value as any)}
        onShowOnlyFavoritesChange={() => setShowOnlyFavorites(prev => !prev)}
        onComparisonModeChange={() => setComparisonMode(prev => !prev)}
        onExportData={exportMatrixData}
      />
      
      <EfficacyMatrixTable 
        nutraceuticos={sortedNutraceuticos}
        condicoes={condicoes}
        data={filteredData}
        viewMode={viewMode}
        favoriteRows={favoriteRows}
        comparisonItems={comparisonItems}
        highlightedNutraceutico={highlightedNutraceutico}
        highlightedCondicao={highlightedCondicao}
        onCellClick={handleCellClick}
        onFavoriteToggle={toggleFavorite}
        onComparisonToggle={toggleComparison}
        onHighlightNutraceutico={setHighlightedNutraceutico}
        onHighlightCondicao={setHighlightedCondicao}
        findCell={findCell}
        getEfficacyColorClass={getEfficacyColorClass}
        getTrendIndicator={getTrendIndicator}
        renderMiniChart={renderMiniChart}
        getRowAverageEfficacy={getRowAverageEfficacy}
        getColumnAverageEfficacy={getColumnAverageEfficacy}
      />
      
      <EfficacyDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedCell={selectedCell}
        selectedNutraceutico={selectedNutraceutico}
        selectedCondicao={selectedCondicao}
        getTrendIndicator={getTrendIndicator}
      />
    </div>
  );
};

export default EfficacyMatrix;
