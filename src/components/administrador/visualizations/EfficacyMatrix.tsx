import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, Search, Filter, Download, Star, StarOff, TrendingUp, TrendingDown, PieChart, BarChart2, ChevronDown } from 'lucide-react';
import { getEvidenceLevel } from '@/rules/general/evidence-levels';
import { ChartContainer } from '@/components/ui/chart';
import '@/components/administrador/visualizations/ai-processing.css';

interface MatrixCell {
  nutraceuticoId: number;
  condicaoId: number;
  efficacyScore: number;
  evidenceLevel: string;
  studyCount: number;
  description?: string;
}

interface MatrixItem {
  id: number;
  name: string;
  description?: string;
  category: 'nutraceutico' | 'condicao';
}

interface EfficacyMatrixProps {
  nutraceuticos: MatrixItem[];
  condicoes: MatrixItem[];
  data: MatrixCell[];
}

const EfficacyMatrix: React.FC<EfficacyMatrixProps> = ({ nutraceuticos, condicoes, data }) => {
  const { t } = useTranslation();
  
  // Estados básicos
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'efficacy'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
  const [selectedNutraceutico, setSelectedNutraceutico] = useState<MatrixItem | null>(null);
  const [selectedCondicao, setSelectedCondicao] = useState<MatrixItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [highlightedNutraceutico, setHighlightedNutraceutico] = useState<number | null>(null);
  const [highlightedCondicao, setHighlightedCondicao] = useState<number | null>(null);
  
  // Novos estados para filtragem avançada e visualização
  const [efficacyFilter, setEfficacyFilter] = useState<string>("all");
  const [evidenceFilter, setEvidenceFilter] = useState<string>("all");
  const [studyCountFilter, setStudyCountFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'standard' | 'compact' | 'detailed'>('standard');
  const [favoriteRows, setFavoriteRows] = useState<number[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonItems, setComparisonItems] = useState<number[]>([]);

  // Função filtrar nutraceuticos por termo de busca, favoritos e filtros avançados
  const filteredNutraceuticos = useMemo(() => {
    let filtered = nutraceuticos;
    
    // Aplicar filtro de busca
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Aplicar filtro de favoritos se ativado
    if (showOnlyFavorites) {
      filtered = filtered.filter(item => favoriteRows.includes(item.id));
    }
    
    return filtered;
  }, [nutraceuticos, searchTerm, favoriteRows, showOnlyFavorites]);

  // Aplicar ordenação aos nutraceuticos filtrados
  const sortedNutraceuticos = useMemo(() => {
    return [...filteredNutraceuticos].sort((a, b) => {
      if (sortBy === 'name') {
        const comparison = a.name.localeCompare(b.name);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      // Ordenação por eficácia média
      if (sortBy === 'efficacy') {
        const efficacyA = getAverageEfficacy(a.id);
        const efficacyB = getAverageEfficacy(b.id);
        const comparison = efficacyA - efficacyB;
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });
  }, [filteredNutraceuticos, sortBy, sortDirection]);

  // Calcular eficácia média para um nutraceutico
  const getAverageEfficacy = useCallback((nutraceuticoId: number) => {
    const cells = data.filter(cell => cell.nutraceuticoId === nutraceuticoId);
    if (cells.length === 0) return 0;
    
    return cells.reduce((sum, cell) => sum + cell.efficacyScore, 0) / cells.length;
  }, [data]);

  // Filtrar células com base nos filtros avançados
  const filteredData = useMemo(() => {
    return data.filter(cell => {
      // Filtro de eficácia
      if (efficacyFilter !== "all") {
        const min = parseInt(efficacyFilter.split('-')[0]);
        const max = parseInt(efficacyFilter.split('-')[1]);
        if (cell.efficacyScore < min || cell.efficacyScore > max) {
          return false;
        }
      }
      
      // Filtro de nível de evidência
      if (evidenceFilter !== "all") {
        const min = parseFloat(evidenceFilter.split('-')[0]);
        const max = parseFloat(evidenceFilter.split('-')[1]);
        const evidenceValue = parseFloat(cell.evidenceLevel);
        if (isNaN(evidenceValue) || evidenceValue < min || evidenceValue > max) {
          return false;
        }
      }
      
      // Filtro de quantidade de estudos
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

  // Gerar classe CSS para células da matriz com base na pontuação
  const getEfficacyColorClass = useCallback((score: number) => {
    if (score >= 80) return "bg-green-500 bg-opacity-20 hover:bg-opacity-30";
    if (score >= 60) return "bg-blue-500 bg-opacity-20 hover:bg-opacity-30";
    if (score >= 40) return "bg-amber-500 bg-opacity-20 hover:bg-opacity-30";
    return "bg-gray-400 bg-opacity-20 hover:bg-opacity-30";
  }, []);

  // Gerar classe para gradiente de heat map
  const getHeatMapClass = useCallback((score: number) => {
    const opacity = Math.max(0.1, score / 100);
    let color = '';
    
    if (score >= 80) color = `rgba(16, 185, 129, ${opacity})`;  // Verde
    else if (score >= 60) color = `rgba(59, 130, 246, ${opacity})`; // Azul
    else if (score >= 40) color = `rgba(245, 158, 11, ${opacity})`; // Âmbar
    else color = `rgba(156, 163, 175, ${opacity})`; // Cinza
    
    return { backgroundColor: color };
  }, []);

  // Encontrar célula na matriz
  const findCell = useCallback((nutraceuticoId: number, condicaoId: number) => {
    return filteredData.find(
      cell => cell.nutraceuticoId === nutraceuticoId && cell.condicaoId === condicaoId
    );
  }, [filteredData]);

  // Manipulador para clique nas células
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

  // Manipuladores para ordenação
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

  // Manipulador para favoritos
  const toggleFavorite = useCallback((nutraceuticoId: number) => {
    setFavoriteRows(prev => {
      if (prev.includes(nutraceuticoId)) {
        return prev.filter(id => id !== nutraceuticoId);
      } else {
        return [...prev, nutraceuticoId];
      }
    });
  }, []);

  // Manipulador para modo de comparação
  const toggleComparison = useCallback((nutraceuticoId: number) => {
    setComparisonItems(prev => {
      if (prev.includes(nutraceuticoId)) {
        return prev.filter(id => id !== nutraceuticoId);
      } else {
        // Limitar a 3 itens para comparação
        if (prev.length >= 3) {
          return [...prev.slice(1), nutraceuticoId];
        }
        return [...prev, nutraceuticoId];
      }
    });
  }, []);

  // Exportar dados da matriz
  const exportMatrixData = useCallback(() => {
    // Criar cabeçalho CSV
    let csvContent = "Nutraceutico,";
    condicoes.forEach(condicao => {
      csvContent += `${condicao.name},`;
    });
    csvContent += "\n";

    // Adicionar dados
    sortedNutraceuticos.forEach(nutraceutico => {
      csvContent += `${nutraceutico.name},`;
      condicoes.forEach(condicao => {
        const cell = findCell(nutraceutico.id, condicao.id);
        csvContent += `${cell ? cell.efficacyScore : "N/A"},`;
      });
      csvContent += "\n";
    });

    // Criar e acionar o download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matriz-eficacia.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [sortedNutraceuticos, condicoes, findCell]);

  // Função para gerar indicador de tendência com base na eficácia
  const getTrendIndicator = useCallback((score: number) => {
    if (score >= 70) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (score >= 50) return <TrendingUp className="h-3 w-3 text-blue-500" />;
    if (score >= 30) return <TrendingDown className="h-3 w-3 text-amber-500" />;
    return <TrendingDown className="h-3 w-3 text-gray-500" />;
  }, []);

  // Função para renderizar miniatura de gráfico nas células detalhadas
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

  // Funções para estatísticas agregadas
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

  return (
    <div className="space-y-4">
      {/* Barra de ferramentas principal */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar nutracêutico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[250px]"
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {t('efficacyMatrix.header.filters')}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">{t('efficacyMatrix.filters.advanced')}</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">{t('efficacyMatrix.filters.efficacy')}</label>
                  <Select value={efficacyFilter} onValueChange={setEfficacyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('efficacyMatrix.filters.selectEfficacy')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">{t('efficacyMatrix.filters.all')}</SelectItem>
                        <SelectItem value="80-100">{t('efficacyMatrix.filters.highEfficacy')}</SelectItem>
                        <SelectItem value="60-79">{t('efficacyMatrix.filters.mediumHighEfficacy')}</SelectItem>
                        <SelectItem value="40-59">{t('efficacyMatrix.filters.mediumEfficacy')}</SelectItem>
                        <SelectItem value="0-39">{t('efficacyMatrix.filters.lowEfficacy')}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">{t('efficacyMatrix.filters.evidenceLevel')}</label>
                  <Select value={evidenceFilter} onValueChange={setEvidenceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('efficacyMatrix.filters.selectEvidence')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">{t('efficacyMatrix.filters.allLevels')}</SelectItem>
                        <SelectItem value="4-5">{t('efficacyMatrix.filters.highEvidence')}</SelectItem>
                        <SelectItem value="3-3.9">{t('efficacyMatrix.filters.mediumEvidence')}</SelectItem>
                        <SelectItem value="0-2.9">{t('efficacyMatrix.filters.lowEvidence')}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">{t('efficacyMatrix.filters.studyCount')}</label>
                  <Select value={studyCountFilter} onValueChange={setStudyCountFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('efficacyMatrix.filters.selectStudies')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">{t('efficacyMatrix.filters.allStudies')}</SelectItem>
                        <SelectItem value="10-999">{t('efficacyMatrix.filters.studies10plus')}</SelectItem>
                        <SelectItem value="5-9">{t('efficacyMatrix.filters.studies5to9')}</SelectItem>
                        <SelectItem value="0-4">{t('efficacyMatrix.filters.studies0to4')}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEfficacyFilter('all');
                      setEvidenceFilter('all');
                      setStudyCountFilter('all');
                    }}
                    className="w-full"
                  >
                    {t('efficacyMatrix.filters.clearFilters')}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('efficacyMatrix.viewMode.label')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="standard">{t('efficacyMatrix.viewMode.standard')}</SelectItem>
                <SelectItem value="compact">{t('efficacyMatrix.viewMode.compact')}</SelectItem>
                <SelectItem value="detailed">{t('efficacyMatrix.viewMode.detailed')}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <Button 
            variant={showOnlyFavorites ? "secondary" : "outline"} 
            size="sm"
            onClick={() => setShowOnlyFavorites(prev => !prev)}
            className="flex items-center"
          >
            <Star className={`mr-1 h-4 w-4 ${showOnlyFavorites ? "text-amber-400" : "text-gray-400"}`} />
            {t('efficacyMatrix.actions.favorites')}
          </Button>
          
          <Button 
            variant={comparisonMode ? "secondary" : "outline"} 
            size="sm"
            onClick={() => {
              setComparisonMode(prev => !prev);
              if (!comparisonMode) {
                setComparisonItems([]);
              }
            }}
            className="flex items-center"
          >
            <BarChart2 className="mr-1 h-4 w-4" />
            {t('efficacyMatrix.actions.compare')}
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportMatrixData} className="flex items-center">
            <Download className="mr-1 h-4 w-4" />
            {t('efficacyMatrix.actions.export')}
          </Button>
        </div>
      </div>
      
      {/* Estatísticas e indicadores - visível apenas no modo detalhado */}
      {viewMode === 'detailed' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="border rounded-md p-3 bg-white shadow-sm">
            <h3 className="text-sm font-medium mb-1">Estatísticas de Eficácia</h3>
            <div className="flex justify-between text-xs text-gray-600">
              <div>
                <p>Média Geral: <span className="font-medium text-blue-600">68.5</span></p>
                <p>Mediana: <span className="font-medium text-blue-600">72.0</span></p>
              </div>
              <div>
                <p>Máxima: <span className="font-medium text-green-600">90</span></p>
                <p>Mínima: <span className="font-medium text-amber-600">40</span></p>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md p-3 bg-white shadow-sm">
            <h3 className="text-sm font-medium mb-1">Distribuição por Nível</h3>
            <div className="flex items-center justify-between text-xs">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md">Alta: 35%</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">Média: 42%</span>
              <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md">Baixa: 23%</span>
            </div>
          </div>
          
          <div className="border rounded-md p-3 bg-white shadow-sm">
            <h3 className="text-sm font-medium mb-1">Evidência Científica</h3>
            <div className="flex items-center justify-between text-xs">
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md">Forte: 28%</span>
              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">Moderada: 47%</span>
              <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-md">Limitada: 25%</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Legendas */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 mr-1 rounded-sm opacity-20"></div>
          <span>Alta Eficácia (80-100)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 mr-1 rounded-sm opacity-20"></div>
          <span>Eficácia Média-Alta (60-79)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-amber-500 mr-1 rounded-sm opacity-20"></div>
          <span>Eficácia Média (40-59)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-500 mr-1 rounded-sm opacity-20"></div>
          <span>Eficácia Limitada (&lt;40)</span>
        </div>
      </div>
      
      {/* Modo de comparação */}
      {comparisonMode && comparisonItems.length > 0 && (
        <div className="bg-slate-50 p-3 rounded-md border mb-2">
          <h3 className="font-medium text-sm mb-2">Modo de Comparação ({comparisonItems.length}/3)</h3>
          <div className="flex gap-2 flex-wrap">
            {comparisonItems.map(itemId => {
              const item = nutraceuticos.find(n => n.id === itemId);
              if (!item) return null;
              
              return (
                <Badge key={itemId} className="bg-white border px-3 py-1">
                  {item.name}
                  <button 
                    onClick={() => toggleComparison(itemId)} 
                    className="ml-1 text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              );
            })}
            
            {comparisonItems.length >= 2 && (
              <Button variant="outline" size="sm" className="ml-auto">
                Ver Análise Comparativa
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Tabela da matriz */}
      <div className="border rounded-md overflow-auto max-h-[600px] bg-white">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px] sticky left-0 bg-white z-10 border-r">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSortBy('name')}
                  >
                    Nutracêutico
                    {sortBy === 'name' && (
                      sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                
                {/* Cabeçalhos de estatísticas para modo detalhado */}
                {viewMode === 'detailed' && (
                  <TableHead className="text-center min-w-[80px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">Eficácia Média</div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Eficácia média de todos os tratamentos</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                )}
                
                {condicoes.map((condicao) => (
                  <TableHead 
                    key={condicao.id} 
                    className={`min-w-[120px] text-center ${highlightedCondicao === condicao.id ? 'bg-gray-100' : ''}`}
                    onMouseEnter={() => setHighlightedCondicao(condicao.id)}
                    onMouseLeave={() => setHighlightedCondicao(null)}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help truncate block max-w-[120px]">
                            {condicao.name}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{condicao.name}</p>
                          {condicao.description && (
                            <p className="text-xs mt-1">{condicao.description}</p>
                          )}
                          {viewMode === 'detailed' && (
                            <div className="mt-2 pt-2 border-t text-xs">
                              <p>Eficácia Média: {getColumnAverageEfficacy(condicao.id).toFixed(1)}</p>
                            </div>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {sortedNutraceuticos.map((nutraceutico) => (
                <TableRow 
                  key={nutraceutico.id}
                  className={`
                    transition-colors
                    ${highlightedNutraceutico === nutraceutico.id ? 'bg-slate-50' : ''}
                    ${comparisonItems.includes(nutraceutico.id) ? 'bg-blue-50' : ''}
                  `}
                  onMouseEnter={() => setHighlightedNutraceutico(nutraceutico.id)}
                  onMouseLeave={() => setHighlightedNutraceutico(null)}
                >
                  <TableCell className="sticky left-0 bg-white z-10 border-r font-medium">
                    <div className="flex items-center justify-between gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {nutraceutico.name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{nutraceutico.name}</p>
                            {nutraceutico.description && (
                              <p className="text-xs mt-1">{nutraceutico.description}</p>
                            )}
                            <div className="flex justify-between gap-4 mt-2 pt-2 border-t">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => toggleFavorite(nutraceutico.id)}
                                className="text-xs px-2 py-0 h-6"
                              >
                                {favoriteRows.includes(nutraceutico.id) ? 
                                  <StarOff className="h-3 w-3 mr-1" /> :
                                  <Star className="h-3 w-3 mr-1" />
                                }
                                {favoriteRows.includes(nutraceutico.id) ? 'Remover' : 'Favoritar'}
                              </Button>
                              
                              {comparisonMode && (
                                <Button 
                                  variant={comparisonItems.includes(nutraceutico.id) ? "secondary" : "outline"} 
                                  size="sm" 
                                  onClick={() => toggleComparison(nutraceutico.id)}
                                  className="text-xs px-2 py-0 h-6"
                                >
                                  {comparisonItems.includes(nutraceutico.id) ? 
                                    'Remover' : 'Comparar'
                                  }
                                </Button>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <div className="flex items-center">
                        {favoriteRows.includes(nutraceutico.id) && (
                          <Star className="h-3.5 w-3.5 text-amber-400" />
                        )}
                        
                        {comparisonMode && comparisonItems.includes(nutraceutico.id) && (
                          <Badge className="ml-1 text-xs py-0 px-1">C</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Célula de estatísticas para modo detalhado */}
                  {viewMode === 'detailed' && (
                    <TableCell className="text-center font-medium">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              {getRowAverageEfficacy(nutraceutico.id).toFixed(1)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Eficácia média para todos os tratamentos</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  )}
                  
                  {condicoes.map((condicao) => {
                    const cell = findCell(nutraceutico.id, condicao.id);
                    
                    return (
                      <TableCell 
                        key={`${nutraceutico.id}-${condicao.id}`} 
                        className={`
                          text-center cursor-pointer transition-all
                          ${cell ? getEfficacyColorClass(cell.efficacyScore) : 'bg-gray-50'}
                          ${(highlightedNutraceutico === nutraceutico.id || highlightedCondicao === condicao.id) 
                            ? 'ring-1 ring-inset ring-gray-200' : ''}
                          ${viewMode === 'compact' ? 'p-1' : viewMode === 'detailed' ? 'p-3' : ''}
                        `}
                        style={cell ? getHeatMapClass(cell.efficacyScore) : {}}
                        onClick={() => cell && handleCellClick(nutraceutico.id, condicao.id)}
                      >
                        {cell ? (
                          <div className="font-medium">
                            {/* Célula detalhada com mais informações */}
                            {viewMode === 'detailed' ? (
                              <div className="flex flex-col items-center">
                                <div className="text-lg">{cell.efficacyScore}</div>
                                <div className="flex items-center justify-between w-full text-xs text-gray-600 mt-1">
                                  <span>E:{cell.evidenceLevel}</span>
                                  <span>S:{cell.studyCount}</span>
                                </div>
                                <div className="mt-1 w-full">
                                  {renderMiniChart(cell.efficacyScore)}
                                </div>
                              </div>
                            ) : viewMode === 'compact' ? (
                              // Versão compacta - apenas o valor
                              <div className="text-sm">{cell.efficacyScore}</div>
                            ) : (
                              // Versão padrão - valor + indicador de tendência
                              <div className="flex items-center justify-center space-x-1">
                                <div>{cell.efficacyScore}</div>
                                {getTrendIndicator(cell.efficacyScore)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">–</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog de detalhes aprimorado */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Eficácia
            </DialogTitle>
          </DialogHeader>
          
          {selectedCell && selectedNutraceutico && selectedCondicao && (
            <div className="space-y-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-600">
                      {selectedNutraceutico.name}
                    </h3>
                    <Badge variant="outline" className="mt-1">
                      Nutracêutico
                    </Badge>
                  </div>
                  <div className="text-2xl font-light text-gray-300">→</div>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold text-green-600">
                      {selectedCondicao.name}
                    </h3>
                    <Badge variant="outline" className="mt-1">
                      Condição de Saúde
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-md">
                <h4 className="font-medium mb-3">Informações de Eficácia</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-500">Pontuação de Eficácia</p>
                    <div className="flex items-baseline">
                      <p className="text-xl font-medium mr-2">{selectedCell.efficacyScore}/100</p>
                      {getTrendIndicator(selectedCell.efficacyScore)}
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-2 ${selectedCell.efficacyScore >= 80 ? 'bg-green-500' : selectedCell.efficacyScore >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${selectedCell.efficacyScore}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-500">Nível de Evidência</p>
                    <p className="text-xl font-medium">{selectedCell.evidenceLevel || "Moderado"}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Baseado em {selectedCell.studyCount} {selectedCell.studyCount === 1 ? 'estudo' : 'estudos'}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-500">Confiabilidade</p>
                    <p className="text-xl font-medium">
                      {selectedCell.studyCount >= 10 ? 'Alta' : selectedCell.studyCount >= 5 ? 'Média' : 'Limitada'}
                    </p>
                    <div className="flex mt-2">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-4 h-1 rounded-full mr-1 ${
                            i < (selectedCell.studyCount > 10 ? 5 : selectedCell.studyCount > 5 ? 3 : 1) 
                            ? 'bg-blue-500' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center">
                    <PieChart className="h-4 w-4 mr-2 text-blue-500" />
                    Histórico de Eficácia
                  </h4>
                  <div className="h-[180px] bg-slate-50 border rounded-md flex items-center justify-center">
                    {/* Gráfico de tendência de eficácia */}
                    <div className="text-sm text-gray-500">
                      Histórico de dados de eficácia ao longo do tempo
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center">
                    <BarChart2 className="h-4 w-4 mr-2 text-green-500" />
                    Comparativo com Alternativas
                  </h4>
                  <div className="h-[180px] bg-slate-50 border rounded-md flex items-center justify-center">
                    {/* Gráfico comparativo com outros tratamentos */}
                    <div className="text-sm text-gray-500">
                      Comparação com outros nutracêuticos para mesma condição
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Descrição da Relação</h4>
                <div className="bg-slate-50 p-4 rounded-md border">
                  <p className="text-sm text-gray-600">
                    {selectedCell.description || 
                      `A relação entre ${selectedNutraceutico.name} e ${selectedCondicao.name} 
                       tem sido estudada em diversos trabalhos científicos, mostrando 
                       ${selectedCell.efficacyScore >= 70 ? 'resultados bastante promissores' : 
                        selectedCell.efficacyScore >= 40 ? 'resultados moderadamente positivos' : 
                        'alguns resultados preliminares'}.`
                    }
                  </p>
                  
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="font-medium mb-2 text-sm">Recomendações</h5>
                    <p className="text-sm text-gray-600">
                      {selectedCell.efficacyScore >= 80 ? 
                        `O uso de ${selectedNutraceutico.name} é altamente recomendado para casos de ${selectedCondicao.name}, com fortes evidências científicas de eficácia.` :
                       selectedCell.efficacyScore >= 60 ?
                        `${selectedNutraceutico.name} apresenta bons resultados no tratamento de ${selectedCondicao.name}, sendo uma opção terapêutica com evidências consistentes.` :
                       selectedCell.efficacyScore >= 40 ?
                        `${selectedNutraceutico.name} pode ser considerado como terapia complementar para ${selectedCondicao.name}, embora as evidências sejam moderadas.` :
                        `O uso de ${selectedNutraceutico.name} para ${selectedCondicao.name} ainda requer mais estudos para confirmar sua eficácia.`
                      }
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4 flex justify-end space-x-2">
                  <Button variant="outline">Ver Estudos Relacionados ({selectedCell.studyCount})</Button>
                  <Button>Explorar Interações</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EfficacyMatrix;

