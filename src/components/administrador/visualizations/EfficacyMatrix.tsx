
import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowDown, ArrowUp, Search, Filter, Download } from 'lucide-react';
import { getEvidenceLevel } from '@/rules/general/evidence-levels';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'efficacy'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
  const [selectedNutraceutico, setSelectedNutraceutico] = useState<MatrixItem | null>(null);
  const [selectedCondicao, setSelectedCondicao] = useState<MatrixItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [highlightedNutraceutico, setHighlightedNutraceutico] = useState<number | null>(null);
  const [highlightedCondicao, setHighlightedCondicao] = useState<number | null>(null);

  // Filtrar nutraceuticos por termo de busca
  const filteredNutraceuticos = useMemo(() => {
    if (!searchTerm.trim()) return nutraceuticos;
    
    return nutraceuticos.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [nutraceuticos, searchTerm]);

  // Ordenar nutraceuticos
  const sortedNutraceuticos = useMemo(() => {
    return [...filteredNutraceuticos].sort((a, b) => {
      if (sortBy === 'name') {
        const comparison = a.name.localeCompare(b.name);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
  }, [filteredNutraceuticos, sortBy, sortDirection]);

  // Função para gerar a classe CSS baseada na pontuação de eficácia
  const getEfficacyColorClass = (score: number) => {
    const level = getEvidenceLevel(score / 20); // Converte o score (0-100) para escala de 0-5
    return `bg-[${level.color}] bg-opacity-20 hover:bg-opacity-30`;
  };

  // Função para encontrar uma célula na matriz
  const findCell = (nutraceuticoId: number, condicaoId: number) => {
    return data.find(
      cell => cell.nutraceuticoId === nutraceuticoId && cell.condicaoId === condicaoId
    );
  };

  // Manipulador para clique nas células
  const handleCellClick = (nutraceuticoId: number, condicaoId: number) => {
    const cell = findCell(nutraceuticoId, condicaoId);
    if (cell) {
      const nutraceutico = nutraceuticos.find(n => n.id === nutraceuticoId) || null;
      const condicao = condicoes.find(c => c.id === condicaoId) || null;
      
      setSelectedCell(cell);
      setSelectedNutraceutico(nutraceutico);
      setSelectedCondicao(condicao);
      setDialogOpen(true);
    }
  };

  // Manipulador para alternar a direção da ordenação
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };
  
  // Manipulador para alternar a coluna de ordenação
  const toggleSortBy = (column: 'name' | 'efficacy') => {
    if (sortBy === column) {
      toggleSortDirection();
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Função para exportar dados da matriz
  const exportMatrixData = () => {
    // Criar cabeçalho CSV
    let csvContent = "Nutraceutico,";
    condicoes.forEach(condicao => {
      csvContent += `${condicao.name},`;
    });
    csvContent += "\n";

    // Adicionar dados
    nutraceuticos.forEach(nutraceutico => {
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
  };

  return (
    <div className="space-y-4">
      {/* Barra de ferramentas */}
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
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>
        
        <Button variant="outline" size="sm" onClick={exportMatrixData}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Dados
        </Button>
      </div>
      
      {/* Legenda */}
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
      
      {/* Tabela da matriz */}
      <div className="border rounded-md overflow-auto max-h-[600px]">
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
                className={highlightedNutraceutico === nutraceutico.id ? 'bg-gray-50' : ''}
                onMouseEnter={() => setHighlightedNutraceutico(nutraceutico.id)}
                onMouseLeave={() => setHighlightedNutraceutico(null)}
              >
                <TableCell className="sticky left-0 bg-white z-10 border-r font-medium">
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
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                {condicoes.map((condicao) => {
                  const cell = findCell(nutraceutico.id, condicao.id);
                  
                  return (
                    <TableCell 
                      key={`${nutraceutico.id}-${condicao.id}`} 
                      className={`text-center cursor-pointer ${
                        cell ? getEfficacyColorClass(cell.efficacyScore) : 'bg-gray-50'
                      } ${
                        (highlightedNutraceutico === nutraceutico.id || highlightedCondicao === condicao.id) 
                        ? 'ring-1 ring-inset ring-gray-200' : ''
                      }`}
                      onClick={() => cell && handleCellClick(nutraceutico.id, condicao.id)}
                    >
                      {cell ? (
                        <div className="font-medium">{cell.efficacyScore}</div>
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

      {/* Dialog de detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Eficácia
            </DialogTitle>
          </DialogHeader>
          
          {selectedCell && selectedNutraceutico && selectedCondicao && (
            <div className="space-y-4">
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
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium mb-2">Informações de Eficácia</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-500">Pontuação de Eficácia</p>
                    <p className="text-xl font-medium">{selectedCell.efficacyScore}/100</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-500">Nível de Evidência</p>
                    <p className="text-xl font-medium">{selectedCell.evidenceLevel || "Moderado"}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-500">Estudos Relacionados</p>
                    <p className="text-xl font-medium">{selectedCell.studyCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Descrição da Relação</h4>
                <p className="text-sm text-gray-600">
                  {selectedCell.description || 
                    `A relação entre ${selectedNutraceutico.name} e ${selectedCondicao.name} 
                     tem sido estudada em diversos trabalhos científicos, mostrando 
                     ${selectedCell.efficacyScore >= 70 ? 'resultados bastante promissores' : 
                      selectedCell.efficacyScore >= 40 ? 'resultados moderadamente positivos' : 
                      'alguns resultados preliminares'}.`
                  }
                </p>
                
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium mb-2">Recomendações</h4>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EfficacyMatrix;
