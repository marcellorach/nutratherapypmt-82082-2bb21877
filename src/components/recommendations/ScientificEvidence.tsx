
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from 'lucide-react';
import { Nutraceutical } from '@/types';

interface ScientificEvidenceProps {
  nutraceutical: Nutraceutical;
}

const ScientificEvidence: React.FC<ScientificEvidenceProps> = ({ nutraceutical }) => {
  return (
    <div>
      <p className="text-sm font-medium mb-1">Evidências científicas:</p>
      <div className="flex gap-2 text-xs mb-2">
        <Badge variant="outline" className="bg-slate-50">
          Eficácia: {nutraceutical.scientificEvidence.efficacyScore}/5
        </Badge>
        <Badge variant="outline" className="bg-slate-50">
          Sustentação: {nutraceutical.scientificEvidence.sustainabilityScore}/5
        </Badge>
      </div>
      <div className="text-xs text-blue-600">
        {nutraceutical.scientificEvidence.studies.slice(0, 1).map((study, index) => (
          <div key={index} className="flex items-center gap-1 hover:underline cursor-pointer">
            <ExternalLink size={12} />
            <span>{study.title} ({study.year})</span>
          </div>
        ))}
        {nutraceutical.scientificEvidence.studies.length > 1 && (
          <p className="text-xs text-gray-500 mt-1">
            + {nutraceutical.scientificEvidence.studies.length - 1} outro(s) estudo(s)
          </p>
        )}
      </div>
    </div>
  );
};

export default ScientificEvidence;
