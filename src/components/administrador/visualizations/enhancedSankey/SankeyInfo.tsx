
import React from 'react';
import { Info } from 'lucide-react';

interface SankeyInfoProps {
  scale: number;
}

const SankeyInfo: React.FC<SankeyInfoProps> = ({ scale }) => {
  return (
    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
      <div className="flex items-center">
        <Info className="h-3 w-3 mr-1" />
        <span>
          Clique nos nós e conexões para ver detalhes. {scale < 1 ? "Reduza o zoom" : scale > 1.5 ? "Aumente o zoom" : "Ajuste o zoom"} para melhor visualização.
        </span>
      </div>
      <span>Escala atual: {Math.round(scale * 100)}%</span>
    </div>
  );
};

export default SankeyInfo;
