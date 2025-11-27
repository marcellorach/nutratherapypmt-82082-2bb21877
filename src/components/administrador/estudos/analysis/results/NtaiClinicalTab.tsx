import React from 'react';
import { Activity } from "lucide-react";
import { ClinicalOutcome, StudyAssessment } from '@/types/ntai';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface NtaiClinicalTabProps {
  outcomes: ClinicalOutcome[];
  assessment?: StudyAssessment;
}

const NtaiClinicalTab: React.FC<NtaiClinicalTabProps> = ({ outcomes, assessment }) => {
  const getSignificanceColor = (sig?: string) => {
    switch (sig) {
      case 'significant': return 'bg-green-100 text-green-700 border-green-300';
      case 'not_significant': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Study Assessment */}
      {assessment && Object.keys(assessment).length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Avaliação do Estudo
          </h5>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {assessment.sample_size && (
              <div>
                <span className="text-muted-foreground">Tamanho da amostra:</span>{' '}
                <span className="font-medium">{assessment.sample_size}</span>
              </div>
            )}
            {assessment.study_duration && (
              <div>
                <span className="text-muted-foreground">Duração:</span>{' '}
                <span className="font-medium">{assessment.study_duration}</span>
              </div>
            )}
            {assessment.randomization !== undefined && (
              <div>
                <span className="text-muted-foreground">Randomizado:</span>{' '}
                <Badge variant={assessment.randomization ? "default" : "secondary"} className="ml-1">
                  {assessment.randomization ? 'Sim' : 'Não'}
                </Badge>
              </div>
            )}
            {assessment.blinding && (
              <div>
                <span className="text-muted-foreground">Cegamento:</span>{' '}
                <span className="font-medium">{assessment.blinding}</span>
              </div>
            )}
            {assessment.placebo_controlled !== undefined && (
              <div>
                <span className="text-muted-foreground">Placebo:</span>{' '}
                <Badge variant={assessment.placebo_controlled ? "default" : "secondary"} className="ml-1">
                  {assessment.placebo_controlled ? 'Sim' : 'Não'}
                </Badge>
              </div>
            )}
            {assessment.quality_score !== undefined && (
              <div>
                <span className="text-muted-foreground">Score de qualidade:</span>{' '}
                <span className="font-medium">{assessment.quality_score}/5</span>
              </div>
            )}
          </div>
          
          {assessment.limitations && assessment.limitations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <span className="text-xs font-medium text-muted-foreground">Limitações:</span>
              <ul className="list-disc list-inside mt-1 space-y-1 text-xs text-muted-foreground">
                {assessment.limitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Clinical Outcomes */}
      <div>
        <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-green-600" />
          Desfechos Clínicos
        </h5>
        
        {outcomes.length > 0 ? (
          <div className="grid gap-3">
            {outcomes.map((out, idx) => (
              <Card key={idx} className="p-3 border-l-4 border-l-green-400">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium flex-1">{out.outcome}</p>
                    <Badge variant="outline" className="ml-2">
                      {out.outcome_type}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-xs">
                    {out.p_value && (
                      <div className="bg-gray-100 px-2 py-1 rounded">
                        <span className="text-muted-foreground">p-value:</span>{' '}
                        <span className="font-mono font-medium">{out.p_value}</span>
                      </div>
                    )}
                    {out.effect_size && (
                      <div className="bg-gray-100 px-2 py-1 rounded">
                        <span className="text-muted-foreground">Tamanho do efeito:</span>{' '}
                        <span className="font-medium">{out.effect_size}</span>
                      </div>
                    )}
                    {out.significance && (
                      <Badge variant="outline" className={getSignificanceColor(out.significance)}>
                        {out.significance}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhum desfecho clínico identificado.</p>
        )}
      </div>
    </div>
  );
};

export default NtaiClinicalTab;
