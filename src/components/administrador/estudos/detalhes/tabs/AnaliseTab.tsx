
import React from 'react';
import { FlaskConical } from "lucide-react";

interface AnaliseTabProps {
  estudo: any;
}

const AnaliseTab: React.FC<AnaliseTabProps> = ({ estudo }) => {
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-md text-sm">
        <p className="text-yellow-700 flex items-center">
          <FlaskConical className="h-4 w-4 mr-2" />
          A análise da IA está processando o conteúdo completo do estudo
        </p>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium">Principais Conclusões</h4>
          <p className="text-sm text-gray-700">
            O estudo demonstra eficácia significativa do nutracêutico para condições articulares
            em cães de médio e grande porte. A dosagem recomendada mostrou resultados estatisticamente
            significativos (p&lt;0.01) após 8 semanas de uso contínuo.
          </p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium">Métricas de Avaliação</h4>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-gray-50 p-2 rounded-md text-center">
              <div className="text-lg font-semibold text-blue-700">4.2/5</div>
              <div className="text-xs text-gray-500">Qualidade Metodológica</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-md text-center">
              <div className="text-lg font-semibold text-blue-700">3.8/5</div>
              <div className="text-xs text-gray-500">Relevância Clínica</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-md text-center">
              <div className="text-lg font-semibold text-green-700">Alto</div>
              <div className="text-xs text-gray-500">Nível de Evidência</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnaliseTab;
