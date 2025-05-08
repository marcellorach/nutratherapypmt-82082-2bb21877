
import React from 'react';
import { NodeCategory } from './types';

interface SankeyLegendProps {
  compact?: boolean;
}

interface LegendItem {
  category: string;
  title: string;
  description: string;
  color: string;
  textColor: string;
}

const SankeyLegend: React.FC<SankeyLegendProps> = ({ compact = false }) => {
  const legendItems: LegendItem[] = [
    {
      category: 'nutraceutico',
      title: 'Nutracêuticos',
      description: 'Substâncias naturais com propriedades terapêuticas',
      color: 'bg-blue-500',
      textColor: 'text-blue-700'
    },
    {
      category: 'condicao',
      title: 'Condições de Saúde',
      description: 'Condições clínicas ou problemas de saúde',
      color: 'bg-green-500',
      textColor: 'text-green-700'
    },
    {
      category: 'outcome',
      title: 'Outcomes',
      description: 'Resultados esperados ou observados',
      color: 'bg-amber-500',
      textColor: 'text-amber-700'
    },
    {
      category: 'severidade',
      title: 'Severidade',
      description: 'Níveis de gravidade das condições',
      color: 'bg-purple-500',
      textColor: 'text-purple-700'
    },
    {
      category: 'tratabilidade',
      title: 'Tratabilidade',
      description: 'Facilidade de tratamento da condição',
      color: 'bg-rose-500',
      textColor: 'text-rose-700'
    }
  ];

  const relationshipTypes = [
    { type: 'prevention', title: 'Prevenção', color: 'bg-green-500' },
    { type: 'treatment', title: 'Tratamento', color: 'bg-blue-500' },
    { type: 'support', title: 'Suporte', color: 'bg-amber-500' },
    { type: 'study', title: 'Estudo', color: 'bg-purple-500' }
  ];

  if (compact) {
    return (
      <div className="mt-4 pt-4 border-t">
        <div className="flex flex-wrap gap-4">
          {legendItems.map(item => (
            <div key={item.category} className="flex items-center">
              <div className={`h-3 w-3 rounded-sm ${item.color} mr-1`}></div>
              <span className="text-xs">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <h4 className="text-sm font-medium mb-2">Legenda</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="text-xs font-medium mb-2">Categorias</h5>
          <div className="grid grid-cols-2 gap-2">
            {legendItems.map(item => (
              <div key={item.category} className="flex items-center">
                <div className={`h-3 w-3 rounded-sm ${item.color} mr-2`}></div>
                <span className={`text-xs ${item.textColor}`}>{item.title}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h5 className="text-xs font-medium mb-2">Tipos de Relações</h5>
          <div className="grid grid-cols-2 gap-2">
            {relationshipTypes.map(rel => (
              <div key={rel.type} className="flex items-center">
                <div className={`h-1 w-6 rounded-sm ${rel.color} mr-2`}></div>
                <span className="text-xs">{rel.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-2">
        <h5 className="text-xs font-medium mb-1">Espessura das Conexões</h5>
        <div className="flex items-center gap-2">
          <div className="h-1 w-10 bg-gray-300 rounded-sm"></div>
          <span className="text-xs">Baixa eficácia</span>
          <div className="h-2 w-10 bg-gray-400 rounded-sm"></div>
          <span className="text-xs">Média eficácia</span>
          <div className="h-3 w-10 bg-gray-500 rounded-sm"></div>
          <span className="text-xs">Alta eficácia</span>
        </div>
      </div>
    </div>
  );
};

export default SankeyLegend;
