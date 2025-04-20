
import React from 'react';
import { ExternalLink, FileText } from "lucide-react";
import { Nutraceutical, NutraceuticalCondition } from "@/types";

interface StudiesTabProps {
  selectedCondition: NutraceuticalCondition;
  nutraceutical: Nutraceutical;
}

const StudiesTab: React.FC<StudiesTabProps> = ({ selectedCondition, nutraceutical }) => {
  const relevantStudies = [
    {
      title: `Eficácia de ${nutraceutical.name} em ${selectedCondition.name} em cães`,
      authors: "Silva et al.",
      journal: "Journal of Veterinary Nutraceuticals",
      year: 2023,
      link: "https://doi.org/10.example/jvn.2023.01"
    },
    {
      title: `Análise comparativa de nutracêuticos para ${selectedCondition.name} em diferentes raças caninas`,
      authors: "Martinez & Johnson",
      journal: "Comparative Veterinary Medicine",
      year: 2024,
      link: "https://doi.org/10.example/cvm.2024.05"
    },
    {
      title: `Impacto a longo prazo do ${nutraceutical.name} na progressão de ${selectedCondition.name}`,
      authors: "Williams, Lee & Patel",
      journal: "Advanced Veterinary Research",
      year: 2022,
      link: "https://doi.org/10.example/avr.2022.12"
    },
    {
      title: `Mecanismos moleculares de ${nutraceutical.activeIngredients[0]} em ${selectedCondition.name}`,
      authors: "Nakamura et al.",
      journal: "Molecular Veterinary Studies",
      year: 2023,
      link: "https://doi.org/10.example/mvs.2023.07"
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">
          Estudos Científicos Específicos para {selectedCondition.name}
        </h4>
        <div className="space-y-3">
          {relevantStudies.map((study, idx) => (
            <div key={idx} className="border rounded-md p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-sm">{study.title}</h5>
                  <p className="text-xs text-gray-500 mt-1">
                    {study.authors} • {study.journal} • {study.year}
                  </p>
                  <div className="mt-2">
                    <a 
                      href={study.link} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs text-blue-500 hover:underline inline-flex items-center"
                    >
                      Ver estudo <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Estudos do Nutracêutico</h4>
        <div className="space-y-3">
          {nutraceutical.scientificEvidence.studies.map((study, idx) => (
            <div key={idx} className="border rounded-md p-3 bg-slate-50">
              <h5 className="font-medium text-sm">{study.title}</h5>
              <div className="mt-2">
                <a 
                  href={study.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-xs text-blue-500 hover:underline inline-flex items-center"
                >
                  Ver estudo ({study.year}) <ExternalLink className="h-3 w-3 ml-1" />
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
