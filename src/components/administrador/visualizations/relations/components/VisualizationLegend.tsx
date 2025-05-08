
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
        <div className="flex items-center ml-2">
          <span className="inline-block w-8 h-px bg-gray-400 mr-2" style={{ backgroundImage: 'linear-gradient(to right, #9ca3af 50%, transparent 50%)', backgroundSize: '6px 1px' }}></span>
          <span>Conexão Potencial</span>
        </div>
        <div className="flex items-center ml-2">
          <span className="inline-block w-8 h-px bg-purple-400 mr-2" style={{ backgroundImage: 'linear-gradient(to right, #8b5cf6 2px, transparent 2px, transparent 4px)', backgroundSize: '4px 1px' }}></span>
          <span>Sinergia</span>
        </div>
      </div>
      <div className="flex flex-wrap mt-2 gap-3 text-xs">
        <div className="flex items-center">
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Alto</Badge>
          <span className="mx-1">→</span>
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Baixo</Badge>
          <span className="ml-1">Nível de Eficácia</span>
        </div>
      </div>
      <div className="mt-3 p-3 bg-gray-50 rounded-md text-xs text-gray-600">
        <p className="font-medium mb-1">Sobre estes dados:</p>
        <p>Os dados visualizados incluem registros reais e dados de demonstração. Linhas tracejadas representam conexões potenciais baseadas em análise de padrões, enquanto linhas sólidas indicam relacionamentos comprovados por estudos científicos.</p>
        <p className="mt-1">As cores das conexões indicam o nível de evidência: verde para alto, azul para médio, laranja para inicial e cinza para potencial/teórico.</p>
      </div>
    </div>
  );
};

export default VisualizationLegend;
