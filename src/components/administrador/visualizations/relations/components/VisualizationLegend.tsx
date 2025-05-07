
import React from 'react';
import { Badge } from '@/components/ui/badge';

const VisualizationLegend: React.FC = () => {
  return (
    <div className="mt-4">
      <div className="text-sm font-medium mb-2">Legenda</div>
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
          <span>Nutracêutico</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          <span>Condição de Saúde</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
          <span>Estudo Científico</span>
        </div>
        <div className="flex items-center">
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Alto</Badge>
          <span className="mx-1">→</span>
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Baixo</Badge>
          <span className="ml-1">Nível de Eficácia</span>
        </div>
      </div>
      <div className="mt-3 p-3 bg-gray-50 rounded-md text-xs text-gray-600">
        <p className="font-medium mb-1">Sobre estes dados:</p>
        <p>Os dados visualizados incluem registros reais e dados de demonstração (prefixados com [DEMO]). Esta visualização permite explorar como os nutracêuticos se relacionam com diferentes condições de saúde em pets e quais estudos científicos suportam essas relações.</p>
        <p className="mt-1">Para mais detalhes sobre cada relação, interaja diretamente com os elementos da visualização.</p>
      </div>
    </div>
  );
};

export default VisualizationLegend;
