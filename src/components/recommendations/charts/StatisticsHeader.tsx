
import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatisticsHeaderProps {
  totalCases: number;
}

const StatisticsHeader: React.FC<StatisticsHeaderProps> = ({ totalCases }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-base font-medium">Estatísticas relevantes</h3>
      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-500">
          Baseado em {totalCases.toLocaleString()} casos analisados
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info size={16} className="text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="w-[200px] text-sm">
                Dados coletados de estudos científicos e da base de clientes PetLove
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default StatisticsHeader;
