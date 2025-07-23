import { useState, useMemo, useCallback } from 'react';
import { MatrixCell, MatrixItem } from '../types';

interface UseEfficacyMatrixProps {
  nutraceuticos: MatrixItem[];
  condicoes: MatrixItem[];
  data: MatrixCell[];
}

export const useEfficacyMatrix = ({ nutraceuticos, condicoes, data }: UseEfficacyMatrixProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'efficacy'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
  const [selectedNutraceutico, setSelectedNutraceutico] = useState<MatrixItem | null>(null);
  const [selectedCondicao, setSelectedCondicao] = useState<MatrixItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [highlightedNutraceutico, setHighlightedNutraceutico] = useState<number | null>(null);
  const [highlightedCondicao, setHighlightedCondicao] = useState<number | null>(null);
  const [efficacyFilter, setEfficacyFilter] = useState<string>("all");
  const [evidenceFilter, setEvidenceFilter] = useState<string>("all");
  const [studyCountFilter, setStudyCountFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'standard' | 'compact' | 'detailed'>('standard');
  const [favoriteRows, setFavoriteRows] = useState<number[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonItems, setComparisonItems] = useState<number[]>([]);

  const filteredNutraceuticos = useMemo(() => {
    let filtered = nutraceuticos;
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (showOnlyFavorites) {
      filtered = filtered.filter(item => favoriteRows.includes(item.id));
    }
    
    return filtered;
  }, [nutraceuticos, searchTerm, favoriteRows, showOnlyFavorites]);

  const getAverageEfficacy = useCallback((nutraceuticoId: number) => {
    const cells = data.filter(cell => cell.nutraceuticoId === nutraceuticoId);
    if (cells.length === 0) return 0;
    
    return cells.reduce((sum, cell) => sum + cell.efficacyScore, 0) / cells.length;
  }, [data]);

  const sortedNutraceuticos = useMemo(() => {
    return [...filteredNutraceuticos].sort((a, b) => {
      if (sortBy === 'name') {
        const comparison = a.name.localeCompare(b.name);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (sortBy === 'efficacy') {
        const efficacyA = getAverageEfficacy(a.id);
        const efficacyB = getAverageEfficacy(b.id);
        const comparison = efficacyA - efficacyB;
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });
  }, [filteredNutraceuticos, sortBy, sortDirection, getAverageEfficacy]);

  const filteredData = useMemo(() => {
    return data.filter(cell => {
      if (efficacyFilter !== "all") {
        if (efficacyFilter === "high" && cell.efficacyScore < 4) return false;
        if (efficacyFilter === "medium" && (cell.efficacyScore < 3 || cell.efficacyScore >= 4)) return false;
        if (efficacyFilter === "low" && cell.efficacyScore >= 3) return false;
      }
      
      if (evidenceFilter !== "all") {
        const min = parseFloat(evidenceFilter.split('-')[0]);
        const max = parseFloat(evidenceFilter.split('-')[1]);
        const evidenceValue = parseFloat(cell.evidenceLevel);
        if (isNaN(evidenceValue) || evidenceValue < min || evidenceValue > max) {
          return false;
        }
      }
      
      if (studyCountFilter !== "all") {
        const min = parseInt(studyCountFilter.split('-')[0]);
        const max = parseInt(studyCountFilter.split('-')[1] || "999");
        if (cell.studyCount < min || cell.studyCount > max) {
          return false;
        }
      }
      
      return true;
    });
  }, [data, efficacyFilter, evidenceFilter, studyCountFilter]);

  const findCell = useCallback((nutraceuticoId: number, condicaoId: number) => {
    return filteredData.find(
      cell => cell.nutraceuticoId === nutraceuticoId && cell.condicaoId === condicaoId
    );
  }, [filteredData]);

  const handleCellClick = useCallback((nutraceuticoId: number, condicaoId: number) => {
    const cell = findCell(nutraceuticoId, condicaoId);
    if (cell) {
      const nutraceutico = nutraceuticos.find(n => n.id === nutraceuticoId) || null;
      const condicao = condicoes.find(c => c.id === condicaoId) || null;
      
      setSelectedCell(cell);
      setSelectedNutraceutico(nutraceutico);
      setSelectedCondicao(condicao);
      setDialogOpen(true);
    }
  }, [findCell, nutraceuticos, condicoes]);

  const toggleSortDirection = useCallback(() => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);
  
  const toggleSortBy = useCallback((column: 'name' | 'efficacy') => {
    if (sortBy === column) {
      toggleSortDirection();
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  }, [sortBy, toggleSortDirection]);

  const toggleFavorite = useCallback((nutraceuticoId: number) => {
    setFavoriteRows(prev => {
      if (prev.includes(nutraceuticoId)) {
        return prev.filter(id => id !== nutraceuticoId);
      } else {
        return [...prev, nutraceuticoId];
      }
    });
  }, []);

  const toggleComparison = useCallback((nutraceuticoId: number) => {
    setComparisonItems(prev => {
      if (prev.includes(nutraceuticoId)) {
        return prev.filter(id => id !== nutraceuticoId);
      } else {
        if (prev.length >= 3) {
          return [...prev.slice(1), nutraceuticoId];
        }
        return [...prev, nutraceuticoId];
      }
    });
  }, []);

  const exportMatrixData = useCallback(() => {
    let csvContent = "Nutraceutico,";
    condicoes.forEach(condicao => {
      csvContent += `${condicao.name},`;
    });
    csvContent += "\n";

    filteredNutraceuticos.forEach(nutraceutico => {
      csvContent += `${nutraceutico.name},`;
      condicoes.forEach(condicao => {
        const cell = findCell(nutraceutico.id, condicao.id);
        csvContent += `${cell ? cell.efficacyScore : "N/A"},`;
      });
      csvContent += "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matriz-eficacia.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [condicoes, filteredNutraceuticos, findCell]);

  return {
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    selectedCell,
    setSelectedCell,
    selectedNutraceutico,
    setSelectedNutraceutico,
    selectedCondicao,
    setSelectedCondicao,
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
    filteredNutraceuticos,
    sortedNutraceuticos,
    filteredData,
    findCell,
    handleCellClick,
    toggleSortDirection,
    toggleSortBy,
    toggleFavorite,
    toggleComparison,
    getAverageEfficacy,
    exportMatrixData
  };
};
