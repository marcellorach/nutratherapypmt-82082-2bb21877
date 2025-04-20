
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import ScoreSummaryCard from '../../../tags/ScoreSummaryCard';

interface VisaoGeralTabProps {
  estudo: any;
  studyScores: {
    qualityScore: number;
    relevanceScore: number;
    noveltyScore: number;
  };
}

const VisaoGeralTab: React.FC<VisaoGeralTabProps> = ({ estudo, studyScores }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Descrição</h3>
              <p className="text-muted-foreground">{estudo.description}</p>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ScoreSummaryCard 
            score={studyScores.qualityScore}
            title="Qualidade Metodológica"
            description="Rigor científico e design do estudo"
          />
          <ScoreSummaryCard 
            score={studyScores.relevanceScore}
            title="Relevância Clínica"
            description="Aplicabilidade na prática veterinária"
          />
          <ScoreSummaryCard 
            score={studyScores.noveltyScore}
            title="Novidade Científica"
            description="Contribuição ao conhecimento existente"
          />
        </div>
      </div>
    </div>
  );
};

export default VisaoGeralTab;
