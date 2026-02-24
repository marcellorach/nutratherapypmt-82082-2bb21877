
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from "@/components/ui/badge";
import { Nutraceutical } from "@/types";

interface ScientificTabProps {
  nutraceutical: Nutraceutical;
}

export const ScientificTab: React.FC<ScientificTabProps> = ({ nutraceutical }) => {
  const { t } = useTranslation();

  const preventionConditions = nutraceutical.preventionConditions || [];
  const treatmentConditions = nutraceutical.treatmentConditions || [];
  const supportConditions = nutraceutical.supportConditions || [];
  
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
                  {t('scientificTab.efficacy')}: {condition.efficacyScore.toFixed(1)}/5
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
      <div className="flex flex-wrap gap-3">
        <Badge className="bg-slate-50 text-slate-800">
          {t('scientificTab.efficacy')}: {nutraceutical.scientificEvidence?.efficacyScore.toFixed(1)}/5
        </Badge>
        <Badge className="bg-slate-50 text-slate-800">
          {t('scientificTab.sustainability')}: {nutraceutical.scientificEvidence?.sustainabilityScore.toFixed(1)}/5
        </Badge>
      </div>
      
      <div className="space-y-4 mt-4">
        {renderConditionSection(
          t('scientificTab.prevention'), 
          preventionConditions, 
          t('scientificTab.noPreventionConditions')
        )}
        
        {renderConditionSection(
          t('scientificTab.treatment'), 
          treatmentConditions, 
          t('scientificTab.noTreatmentConditions')
        )}
        
        {renderConditionSection(
          t('scientificTab.support'), 
          supportConditions, 
          t('scientificTab.noSupportConditions')
        )}
      </div>
      
      <div className="mt-4">
        <h3 className="font-medium mb-2">{t('scientificTab.scientificStudies')}</h3>
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
            {t('scientificTab.noStudies')}
          </div>
        )}
      </div>
    </div>
  );
};
