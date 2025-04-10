
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, CheckCircle2 } from 'lucide-react';
import { Recommendation, Nutraceutical } from '@/types';

interface DetailViewerProps {
  recommendation: Recommendation;
  nutraceutical: Nutraceutical;
  isApproved: boolean;
  onApprove: () => void;
}

const DetailViewer: React.FC<DetailViewerProps> = ({ 
  recommendation, 
  nutraceutical, 
  isApproved, 
  onApprove 
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-2">Motivo da recomendação</h4>
        <p className="bg-slate-50 p-3 rounded-md">{recommendation.reason}</p>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">Base científica</h4>
        <div className="bg-slate-50 p-3 rounded-md">
          <div className="flex gap-2 mb-2">
            <Badge variant="outline">Eficácia: {nutraceutical.scientificEvidence.efficacyScore}/5</Badge>
            <Badge variant="outline">Sustentação: {nutraceutical.scientificEvidence.sustainabilityScore}/5</Badge>
          </div>
          
          <div className="space-y-2">
            {nutraceutical.scientificEvidence.studies.map((study, i) => (
              <div key={i} className="text-sm">
                <a href={study.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                  {study.title} ({study.year})
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">Contraindicações</h4>
        <ul className="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded-md">
          {nutraceutical.contraindications.map((c, i) => (
            <li key={i} className="text-sm">{c}</li>
          ))}
        </ul>
      </div>
      
      <div className="mt-4 flex justify-end gap-2">
        <Button 
          className={`flex items-center gap-1 border ${isApproved 
            ? "bg-green-600 hover:bg-green-700" 
            : "bg-green-100 text-green-800 hover:bg-green-200 border-green-300"}`}
          onClick={onApprove}
          disabled={isApproved}
        >
          {isApproved ? <CheckCircle2 size={16} /> : <ThumbsUp size={16} />}
          {isApproved ? "Já aprovado" : "Aprovar recomendação"}
        </Button>
      </div>
    </div>
  );
};

export default DetailViewer;
