
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from 'lucide-react';
import { ExamResult } from '@/types';
import { useToast } from "@/hooks/use-toast";

interface ExamViewerProps {
  petExams: ExamResult[];
  petId: string;
}

const ExamViewer: React.FC<ExamViewerProps> = ({ petExams, petId }) => {
  const [examRequestSent, setExamRequestSent] = useState(false);
  const { toast } = useToast();
  
  const handleRequestExams = () => {
    setExamRequestSent(true);
    toast({
      title: "Exames solicitados",
      description: "As solicitações de exames foram enviadas para o tutor do pet.",
      variant: "default",
    });
  };

  return (
    <div>
      {petExams.length > 0 ? (
        <div className="space-y-4 mb-6">
          {petExams.map((exam) => (
            <div key={exam.id} className="border rounded-md p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{exam.type}</h4>
                  <p className="text-sm text-gray-500">{exam.date}</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">Realizado</Badge>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Object.entries(exam.results).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-gray-500">{key}: </span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
              
              {exam.notes && (
                <div className="mt-4 text-sm bg-amber-50 p-2 rounded">
                  <span className="font-medium">Observações: </span>
                  {exam.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50 rounded-md mb-6">
          <AlertCircle className="mx-auto text-amber-500 mb-2" size={24} />
          <p className="text-gray-700 mb-2">Este paciente não possui exames registrados.</p>
          <Button 
            className="mt-2"
            onClick={handleRequestExams}
            disabled={examRequestSent}
          >
            {examRequestSent ? "Exames solicitados" : "Solicitar exames"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExamViewer;
