import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star, StarOff } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { MatrixCell, MatrixItem } from './types';

interface EfficacyMatrixTableProps {
  nutraceuticos: MatrixItem[];
  condicoes: MatrixItem[];
  data: MatrixCell[];
  viewMode: string;
  favoriteRows: number[];
  comparisonItems: number[];
  highlightedNutraceutico: number | null;
  highlightedCondicao: number | null;
  onCellClick: (nutraceuticoId: number, condicaoId: number) => void;
  onFavoriteToggle: (nutraceuticoId: number) => void;
  onComparisonToggle: (nutraceuticoId: number) => void;
  onHighlightNutraceutico: (id: number | null) => void;
  onHighlightCondicao: (id: number | null) => void;
  findCell: (nutraceuticoId: number, condicaoId: number) => MatrixCell | undefined;
  getEfficacyColorClass: (score: number) => string;
  getTrendIndicator: (score: number) => JSX.Element;
  renderMiniChart: (score: number) => JSX.Element | null;
  getRowAverageEfficacy: (nutraceuticoId: number) => number;
  getColumnAverageEfficacy: (condicaoId: number) => number;
}

export const EfficacyMatrixTable: React.FC<EfficacyMatrixTableProps> = ({
  nutraceuticos,
  condicoes,
  data,
  viewMode,
  favoriteRows,
  comparisonItems,
  highlightedNutraceutico,
  highlightedCondicao,
  onCellClick,
  onFavoriteToggle,
  onComparisonToggle,
  onHighlightNutraceutico,
  onHighlightCondicao,
  findCell,
  getEfficacyColorClass,
  getTrendIndicator,
  renderMiniChart,
  getRowAverageEfficacy,
  getColumnAverageEfficacy
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="border rounded-md overflow-auto max-h-[600px] bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px] sticky left-0 bg-white z-10 border-r">
              {t('efficacyMatrix.table.nutraceutical')}
            </TableHead>
            
            {viewMode === 'detailed' && (
              <TableHead className="text-center min-w-[80px]">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">{t('efficacyMatrix.table.averageEfficacy')}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('efficacyMatrix.table.averageEfficacyTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
            )}
            
            {condicoes.map((condicao) => (
              <TableHead 
                key={condicao.id} 
                className={`min-w-[120px] text-center ${highlightedCondicao === condicao.id ? 'bg-gray-100' : ''}`}
                onMouseEnter={() => onHighlightCondicao(condicao.id)}
                onMouseLeave={() => onHighlightCondicao(null)}
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
          {nutraceuticos.map((nutraceutico) => (
            <TableRow 
              key={nutraceutico.id}
              className={`
                transition-colors
                ${highlightedNutraceutico === nutraceutico.id ? 'bg-slate-50' : ''}
                ${comparisonItems.includes(nutraceutico.id) ? 'bg-blue-50' : ''}
              `}
              onMouseEnter={() => onHighlightNutraceutico(nutraceutico.id)}
              onMouseLeave={() => onHighlightNutraceutico(null)}
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
                            onClick={() => onFavoriteToggle(nutraceutico.id)}
                            className="text-xs px-2 py-0 h-6"
                          >
                            {favoriteRows.includes(nutraceutico.id) ? 
                              <StarOff className="h-3 w-3 mr-1" /> :
                              <Star className="h-3 w-3 mr-1" />
                            }
                            {favoriteRows.includes(nutraceutico.id) ? t('efficacyMatrix.actions.remove') : t('efficacyMatrix.actions.favorite')}
                          </Button>
                          
                          {comparisonItems && (
                            <Button 
                              variant={comparisonItems.includes(nutraceutico.id) ? "secondary" : "outline"} 
                              size="sm" 
                              onClick={() => onComparisonToggle(nutraceutico.id)}
                              className="text-xs px-2 py-0 h-6"
                            >
                              {comparisonItems.includes(nutraceutico.id) ? 
                                t('efficacyMatrix.actions.remove') : t('efficacyMatrix.actions.compare')
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
                    
                    {comparisonItems && comparisonItems.includes(nutraceutico.id) && (
                      <Badge className="ml-1 text-xs py-0 px-1">C</Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              
              {viewMode === 'detailed' && (
                <TableCell className="text-center font-medium">
                  {getRowAverageEfficacy(nutraceutico.id).toFixed(1)}
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
                    onClick={() => cell && onCellClick(nutraceutico.id, condicao.id)}
                  >
                    {cell ? (
                      <div className="font-medium">
                        {viewMode === 'detailed' ? (
                          <div className="flex flex-col items-center">
                            <div className="text-lg">{cell.efficacyScore}</div>
                            <div className="flex items-center justify-between w-full text-xs text-gray-600 mt-1">
                              <span>E:{cell.evidenceLevel}</span>
                              <span>S:{cell.studyCount}</span>
                            </div>
                            {renderMiniChart(cell.efficacyScore)}
                          </div>
                        ) : viewMode === 'compact' ? (
                          <div className="text-sm">{cell.efficacyScore}</div>
                        ) : (
                          <div className="flex items-center justify-center space-x-1">
                            <div>{cell.efficacyScore}</div>
                            {getTrendIndicator(cell.efficacyScore)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300">{t('efficacyMatrix.table.noData')}</span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
