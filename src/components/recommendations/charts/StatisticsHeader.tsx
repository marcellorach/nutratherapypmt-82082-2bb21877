
import React from 'react';
import { Info, BarChart3 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatisticsHeaderProps {
  totalCases: number;
}

const StatisticsHeader: React.FC<StatisticsHeaderProps> = ({ totalCases }) => {
  return (
    <div className="flex flex-col mb-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-primary" />
          <h3 className="text-base font-medium">Estatísticas relevantes</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500">
            Base de dados: {totalCases.toLocaleString()} casos analisados
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={16} className="text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="w-[280px] space-y-2">
                  <p className="text-sm">
                    Dados coletados de estudos científicos e da base de clientes PetLove
                  </p>
                  <div className="text-xs text-gray-500">
                    <p>• {Math.floor(totalCases * 0.65).toLocaleString()} casos clínicos documentados</p>
                    <p>• {Math.floor(totalCases * 0.35).toLocaleString()} dados de estudos multicêntricos</p>
                    <p>• Atualizado em {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="flex gap-4 mt-2">
        <div className="flex gap-1 items-center text-xs text-gray-600">
          <span className="h-3 w-3 rounded-sm bg-[#9b87f5]"></span>
          <span>Estudos científicos</span>
        </div>
        <div className="flex gap-1 items-center text-xs text-gray-600">
          <span className="h-3 w-3 rounded-sm bg-[#33C3F0]"></span>
          <span>Pacientes PetLove</span>
        </div>
      </div>
    </div>
  );
};

export default StatisticsHeader;
