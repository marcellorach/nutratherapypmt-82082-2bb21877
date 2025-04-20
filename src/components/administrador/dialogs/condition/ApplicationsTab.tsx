
import React from 'react';
import { NutraceuticalCondition, Nutraceutical } from "@/types";

interface ApplicationsTabProps {
  selectedCondition: NutraceuticalCondition;
  nutraceutical: Nutraceutical;
  conditionType: 'prevention' | 'treatment' | 'support';
}

const ApplicationsTab: React.FC<ApplicationsTabProps> = ({
  selectedCondition,
  nutraceutical,
  conditionType,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Indicações Clínicas para {selectedCondition.name}</h4>
        <div className="bg-slate-50 p-3 rounded-md text-sm">
          <p>
            O uso de {nutraceutical.name} é especialmente recomendado para {conditionType === 'prevention' ? 'prevenção' : conditionType === 'treatment' ? 'tratamento' : 'suporte'} 
            de {selectedCondition.name} nas seguintes situações:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Quadros {conditionType === 'prevention' ? 'iniciais com fatores de risco' : conditionType === 'treatment' ? 'diagnosticados' : 'em fase de recuperação'}</li>
            <li>Pacientes com {conditionType === 'prevention' ? 'predisposição genética' : conditionType === 'treatment' ? 'manifestações clínicas' : 'necessidade de suporte nutricional'}</li>
            <li>Como parte de {conditionType === 'prevention' ? 'estratégias preventivas' : conditionType === 'treatment' ? 'protocolos terapêuticos' : 'terapias complementares'}</li>
          </ul>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Protocolos de Administração</h4>
        <div className="bg-slate-50 p-3 rounded-md text-sm">
          <p className="font-medium mb-1">Protocolo padrão:</p>
          <p>{nutraceutical.dosage}</p>
          
          <p className="font-medium mt-3 mb-1">Protocolo específico para {selectedCondition.name}:</p>
          <p>
            {conditionType === 'prevention' 
              ? `Administrar ${nutraceutical.dosage.toLowerCase()} por 3 meses, avaliar e continuar por mais 9 meses.` 
              : conditionType === 'treatment' 
                ? `Iniciar com dose de ataque (${nutraceutical.dosage.split(' ')[0]} dobrada) por 2 semanas, seguido de dose padrão por 3-6 meses.`
                : `Administrar ${nutraceutical.dosage.toLowerCase()} continuamente durante todo o período de convalescença.`}
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Contraindicações</h4>
        <ul className="list-disc pl-5 space-y-1 bg-slate-50 p-3 rounded-md">
          {nutraceutical.contraindications.map((c, i) => (
            <li key={i} className="text-sm">{c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ApplicationsTab;
