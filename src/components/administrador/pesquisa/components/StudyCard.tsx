import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Study } from '../types/oraBiomedical';
import DetailedStudyCharts from './DetailedStudyCharts';

interface StudyCardProps {
  study: Study;
}

const StudyCard: React.FC<StudyCardProps> = ({ study }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{study.title}</h3>
              <p className="text-sm text-muted-foreground">{study.description}</p>
            </div>
            <Button variant="outline" onClick={() => setShowDetails(true)}>
              Ver detalhes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span>{study.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Início:</span>
              <span>{study.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Fim:</span>
              <span>{study.endDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Objetivo:</span>
              <span>{study.objective}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{study.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <DetailedStudyCharts isComplete={study.status === 'completed'} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StudyCard;
