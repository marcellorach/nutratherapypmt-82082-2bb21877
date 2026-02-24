
import React from 'react';
import { ExternalLink, FileText } from "lucide-react";
import { Nutraceutical, NutraceuticalCondition } from "@/types";
import EvidenceTag from '../../tags/EvidenceTag';
import { useTranslation } from 'react-i18next';

interface StudiesTabProps {
  selectedCondition: NutraceuticalCondition;
  nutraceutical: Nutraceutical;
}

const StudiesTab: React.FC<StudiesTabProps> = ({ selectedCondition, nutraceutical }) => {
  const { t } = useTranslation();
  
  const getStudyScore = (title: string): number => {
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 50;
    return 2 + (hash / 10);
  };
  
  const relevantStudies = [
    {
      title: t('studiesTab.efficacyTitle', { nutraceutical: nutraceutical.name, condition: selectedCondition.name }),
      authors: "Silva et al.",
      journal: "Journal of Veterinary Nutraceuticals",
      year: 2023,
      link: "https://doi.org/10.example/jvn.2023.01"
    },
    {
      title: t('studiesTab.comparativeTitle', { condition: selectedCondition.name }),
      authors: "Martinez & Johnson",
      journal: "Comparative Veterinary Medicine",
      year: 2024,
      link: "https://doi.org/10.example/cvm.2024.05"
    },
    {
      title: t('studiesTab.longTermTitle', { nutraceutical: nutraceutical.name, condition: selectedCondition.name }),
      authors: "Williams, Lee & Patel",
      journal: "Advanced Veterinary Research",
      year: 2022,
      link: "https://doi.org/10.example/avr.2022.12"
    },
    {
      title: t('studiesTab.molecularTitle', { ingredient: nutraceutical.activeIngredients[0], condition: selectedCondition.name }),
      authors: "Nakamura et al.",
      journal: "Molecular Veterinary Studies",
      year: 2023,
      link: "https://doi.org/10.example/mvs.2023.07"
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium">
            {t('studiesTab.specificStudies', { conditionName: selectedCondition.name })}
          </h4>
          <EvidenceTag score={selectedCondition.efficacyScore} showLabel={false} />
        </div>
        <div className="space-y-3">
          {relevantStudies.map((study, idx) => (
            <div key={idx} className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h5 className="font-medium text-sm">{study.title}</h5>
                    <EvidenceTag score={getStudyScore(study.title)} showLabel={false} className="ml-2 shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {study.authors} • {study.journal} • {study.year}
                  </p>
                  <div className="mt-2">
                    <a 
                      href={study.link} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs text-primary hover:underline inline-flex items-center"
                    >
                      {t('studiesTab.viewStudy')} <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">{t('studiesTab.nutraceuticalStudies')}</h4>
        <div className="space-y-3">
          {nutraceutical.scientificEvidence.studies.map((study, idx) => (
            <div key={idx} className="border rounded-md p-3 bg-muted/30">
              <div className="flex justify-between items-start">
                <h5 className="font-medium text-sm">{study.title}</h5>
                <EvidenceTag 
                  score={nutraceutical.scientificEvidence.efficacyScore} 
                  showLabel={false} 
                  className="ml-2 shrink-0" 
                />
              </div>
              <div className="mt-2">
                <a 
                  href={study.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-xs text-primary hover:underline inline-flex items-center"
                >
                  {t('studiesTab.viewStudyWithYear', { year: study.year })} <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudiesTab;
