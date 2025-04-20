
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EvidenceTag from '../../tags/EvidenceTag';
import NutraceuticalTag from '../../tags/NutraceuticalTag';

interface EstudoCardProps {
  estudo: any;
  onView: (estudo: any) => void;
  buttonLabel?: string;
  getNutraceuticalScore: (name: string) => number;
}

const EstudoCard: React.FC<EstudoCardProps> = ({ 
  estudo, 
  onView, 
  buttonLabel = "Ver Detalhes",
  getNutraceuticalScore 
}) => {
  return (
    <Card key={estudo.id}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>{estudo.title}</CardTitle>
          <EvidenceTag score={estudo.qualityScore} showLabel={false} />
        </div>
        <CardDescription>{estudo.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {estudo.nutraceuticals?.map((nutra: string, idx: number) => (
            <NutraceuticalTag 
              key={idx} 
              name={nutra} 
              score={getNutraceuticalScore(nutra)} 
            />
          ))}
        </div>
        <Button 
          variant="outline" 
          className="w-full" 
          size="sm"
          onClick={() => onView(estudo)}
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EstudoCard;
