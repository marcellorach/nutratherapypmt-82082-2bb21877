
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Nutraceutical } from "@/types";

interface ScientificTabProps {
  nutraceutical: Nutraceutical;
}

export const ScientificTab: React.FC<ScientificTabProps> = ({ nutraceutical }) => {
  // Dividir condições por tipo de relacionamento
  const preventionConditions = nutraceutical.preventionConditions || [];
  const treatmentConditions = nutraceutical.treatmentConditions || [];
  const supportConditions = nutraceutical.supportConditions || [];
  
  // Função para render uma seção de condições
  const renderConditionSection = (title: string, conditions: any[], emptyMessage: string) => {
    return (
      <div className="mb-4">
        <h3 className="font-medium mb-2">{title}</h3>
        {conditions.length > 0 ? (
          <div className="grid gap-2">
            {conditions.map((condition, index) => (
              <div 
                key={index} 
                className="bg-slate-50 p-2 rounded flex justify-between items-center"
              >
                <div>{condition.name}</div>
                <Badge 
                  variant={condition.efficacyScore >= 4 ? "default" : "secondary"}
                >
                  Eficácia: {condition.efficacyScore.toFixed(1)}/5
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground bg-slate-50 p-2 rounded">
            {emptyMessage}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Pontuação científica */}
      <div className="flex flex-wrap gap-3">
        <Badge className="bg-slate-50 text-slate-800">
          Eficácia: {nutraceutical.scientificEvidence?.efficacyScore.toFixed(1)}/5
        </Badge>
        <Badge className="bg-slate-50 text-slate-800">
          Sustentação: {nutraceutical.scientificEvidence?.sustainabilityScore.toFixed(1)}/5
        </Badge>
      </div>
      
      {/* Categorias de condições */}
      <div className="space-y-4 mt-4">
        {renderConditionSection(
          "Prevenção", 
          preventionConditions, 
          "Este nutracêutico não tem condições de prevenção cadastradas."
        )}
        
        {renderConditionSection(
          "Tratamento", 
          treatmentConditions, 
          "Este nutracêutico não tem condições de tratamento cadastradas."
        )}
        
        {renderConditionSection(
          "Suporte", 
          supportConditions, 
          "Este nutracêutico não tem condições de suporte cadastradas."
        )}
      </div>
      
      {/* Estudos científicos */}
      <div className="mt-4">
        <h3 className="font-medium mb-2">Estudos Científicos</h3>
        {nutraceutical.scientificEvidence?.studies?.length > 0 ? (
          <div className="space-y-3">
            {nutraceutical.scientificEvidence.studies.map((study, i) => (
              <div key={i} className="bg-slate-50 p-3 rounded">
                <a 
                  href={study.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-blue-600 hover:underline"
                >
                  {study.title}
                </a>
                <div className="text-sm text-muted-foreground mt-1">
                  {study.year}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground bg-slate-50 p-2 rounded">
            Este nutracêutico não tem estudos científicos cadastrados.
          </div>
        )}
      </div>
    </div>
  );
};
